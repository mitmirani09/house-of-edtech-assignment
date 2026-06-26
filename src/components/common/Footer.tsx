import React from 'react'

const Footer = () => {
    return (
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className='text-primary font-semibold'>© Mit Mirani</p>
            <div className="flex gap-4">
                <a href="https://github.com/mitmirani09" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
                <a href="https://www.linkedin.com/in/mit-mirani" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn</a>
            </div>
        </div>
    )
}

export default Footer