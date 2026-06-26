import './env'
import { WebSocketServer, WebSocket } from 'ws'
import * as url from 'url'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import prisma from '../lib/prisma'
import { Role } from '@prisma/client'

const PORT = parseInt(process.env.WS_PORT || '1234')
const wsReadyStateOpen = 1

interface ExtWebSocket extends WebSocket {
  isReadOnly?: boolean;
  userId?: string;
  documentId?: string;
  controlledIds: Set<number>;
}

class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Set<ExtWebSocket>;
  awareness: awarenessProtocol.Awareness;

  constructor(name: string) {
    super()
    this.name = name
    this.conns = new Set()
    this.awareness = new awarenessProtocol.Awareness(this)

    // Setup update handler
    const updateHandler = (update: Uint8Array, origin: unknown) => {
      // Broadcast document changes to all other connected clients in the room
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, 0) // messageSync
      syncProtocol.writeUpdate(encoder, update)
      const message = encoding.toUint8Array(encoder)

      this.conns.forEach(conn => {
        if (conn !== origin && conn.readyState === wsReadyStateOpen) {
          send(this, conn, message)
        }
      })
    }

    this.on('update', updateHandler)

    // Setup awareness handler (cursor position, typing state, name, color)
    const awarenessHandler = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      const changedClients = added.concat(updated, removed)

      // Track client IDs on the origin connection for proper cleanup on close
      const originConn = origin as ExtWebSocket | undefined
      if (originConn && originConn.controlledIds) {
        added.forEach((id: number) => originConn.controlledIds.add(id))
        removed.forEach((id: number) => originConn.controlledIds.delete(id))
      }

      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, 1) // messageAwareness
      const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      encoding.writeVarUint8Array(encoder, update)
      const message = encoding.toUint8Array(encoder)

      this.conns.forEach(conn => {
        if (conn.readyState === wsReadyStateOpen) {
          send(this, conn, message)
        }
      })
    }

    this.awareness.on('update', awarenessHandler)
  }
}

const docs = new Map<string, WSSharedDoc>()

const getRoom = (docId: string): WSSharedDoc => {
  let doc = docs.get(docId)
  if (!doc) {
    doc = new WSSharedDoc(docId)
    docs.set(docId, doc)
    console.log(`Document room ${docId} created.`)
  }
  return doc
}

const send = (doc: WSSharedDoc, conn: ExtWebSocket, message: Uint8Array) => {
  if (conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn)
    return
  }
  try {
    conn.send(message, (err) => {
      if (err) closeConn(doc, conn)
    })
  } catch {
    closeConn(doc, conn)
  }
}

const closeConn = (doc: WSSharedDoc, conn: ExtWebSocket) => {
  if (doc.conns.has(conn)) {
    doc.conns.delete(conn)
    console.log(`Connection for User ${conn.userId} removed. Room size: ${doc.conns.size}`)

    // Clean up awareness states associated with this socket session
    if (conn.controlledIds && conn.controlledIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(conn.controlledIds), conn)
    }
  }
  if (doc.conns.size === 0) {
    docs.delete(doc.name)
    console.log(`Room ${doc.name} deleted (no active connections).`)
  }
  conn.close()
}

// Start WebSocket Server
const wss = new WebSocketServer({ port: PORT })

wss.on('connection', async (conn: ExtWebSocket, req) => {
  conn.controlledIds = new Set<number>()

  const parsedUrl = url.parse(req.url || '', true)
  const docId = parsedUrl.query.room as string
  const userId = parsedUrl.query.userId as string

  if (!docId || !userId) {
    console.error('Connection rejected: Missing room or userId parameters.')
    conn.close()
    return
  }

  // Authenticate user against DB membership & fetch role
  try {
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId: docId,
        },
      },
    })

    if (!membership) {
      console.error(`Connection rejected: User ${userId} has no membership in Document ${docId}.`)
      conn.close()
      return
    }

    conn.userId = userId
    conn.documentId = docId
    conn.isReadOnly = membership.role === Role.VIEWER

    console.log(
      `User ${userId} successfully connected as ${membership.role} to Document ${docId}.`
    )
  } catch (err) {
    console.error('Database authentication error during WebSocket upgrade:', err)
    conn.close()
    return
  }

  const room = getRoom(docId)
  room.conns.add(conn)

  // Listen to incoming messages
  conn.on('message', (message: Buffer) => {
    try {
      const uint8 = new Uint8Array(message)
      const decoder = decoding.createDecoder(uint8)
      const messageType = decoding.readVarUint(decoder)

      // Block viewer write attempts at the server level
      if (conn.isReadOnly) {
        if (messageType === 0) { // Sync protocol
          const syncType = decoding.readVarUint(decoder)
          if (syncType === 1 || syncType === 2) {
            console.warn(`Blocked unauthorized write update from viewer ${conn.userId} in room ${conn.documentId}`)
            return
          }
        }
      }

      // Reset decoder to process normally
      const normalDecoder = decoding.createDecoder(uint8)
      decoding.readVarUint(normalDecoder) // skip messageType

      if (messageType === 0) { // Sync Message
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, 0) // messageSync
        syncProtocol.readSyncMessage(normalDecoder, encoder, room, conn)

        if (encoding.length(encoder) > 1) {
          send(room, conn, encoding.toUint8Array(encoder))
        }
      } else if (messageType === 1) { // Awareness Message
        const update = decoding.readVarUint8Array(normalDecoder)
        awarenessProtocol.applyAwarenessUpdate(room.awareness, update, conn)
      }
    } catch (err) {
      console.error(`Error processing message from user ${conn.userId}:`, err)
    }
  })

  // Listen to connection errors & closes
  conn.on('close', () => {
    closeConn(room, conn)
  })

  conn.on('error', () => {
    closeConn(room, conn)
  })

  // Start Sync Handshake: Send Yjs SyncStep1 to client
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0) // messageSync
  syncProtocol.writeSyncStep1(encoder, room)
  send(room, conn, encoding.toUint8Array(encoder))

  // Broadcast current awareness states to new client
  const awarenessStates = room.awareness.getStates()
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder()
    encoding.writeVarUint(awarenessEncoder, 1) // messageAwareness
    const update = awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(awarenessStates.keys()))
    encoding.writeVarUint8Array(awarenessEncoder, update)
    send(room, conn, encoding.toUint8Array(awarenessEncoder))
  }
})

console.log(`Collaboration WebSocket Server running on ws://localhost:${PORT}`)
