// IPFS Video Initialization
// This module provides basic IPFS video support for A-Frame scenes

import { create } from 'ipfs-http-client';

// Initialize IPFS client
const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
});

// Function to handle IPFS video loading
export async function loadIPFSVideo(ipfsHash) {
    try {
        const stream = ipfs.cat(ipfsHash);
        const chunks = [];
        
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        
        const blob = new Blob(chunks, { type: 'video/mp4' });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error loading IPFS video:', error);
        throw error;
    }
}

// Function to create an A-Frame video entity with IPFS source
export function createIPFSVideoEntity(ipfsHash, position = { x: 0, y: 0, z: 0 }) {
    const entity = document.createElement('a-video');
    entity.setAttribute('position', position);
    
    loadIPFSVideo(ipfsHash)
        .then(videoUrl => {
            entity.setAttribute('src', videoUrl);
        })
        .catch(error => {
            console.error('Failed to load IPFS video:', error);
        });
    
    return entity;
}

// Initialize IPFS video support
console.log('IPFS video support initialized'); 