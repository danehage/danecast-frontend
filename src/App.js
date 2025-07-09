// App.js

import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import axios from 'axios';
import { X } from 'lucide-react'; // Icon for the remove button
import './App.css';

// --- Main App Component ---
// This now manages a list of watermark items
function App() {
  // Source data for the watermarks
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [ipAddress, setIpAddress] = useState('');

  // The list of all watermark items on the screen
  const [items, setItems] = useState([]);
  
  // Which item is currently selected for editing
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Fetch the IP address once when the app loads
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await axios.get('https://api.ipify.org?format=json');
        setIpAddress(response.data.ip);
      } catch (error) {
        console.error("Could not fetch IP address:", error);
        setIpAddress("Unavailable");
      }
    };
    fetchIp();
  }, []);

  // Find the currently selected item object
  const selectedItem = items.find(item => item.id === selectedItemId);

  // --- Functions to manipulate the items list ---

  const addItem = (type, text = '') => {
    const newItem = {
      id: crypto.randomUUID(), // Generate a unique ID
      type,
      text,
      x: 20,
      y: 20,
      width: 250,
      height: 50,
      rotation: 0,
      fontSize: 22, // Add fontSize to state
      opacity: 1,   // Add opacity to state
    };
    setItems(prevItems => [...prevItems, newItem]);
    setSelectedItemId(newItem.id); // Select the new item immediately
  };

  const updateItem = (id, newProps) => {
    setItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, ...newProps } : item))
    );
  };

  const removeItem = (id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    setSelectedItemId(null); // Deselect if the removed item was selected
  };

  return (
    <div className="App">
      <AdminPanel
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        ipAddress={ipAddress}
        addItem={addItem}
        selectedItem={selectedItem}
        updateItem={updateItem}
      />
      <LivestreamPage
        items={items}
        sourceData={{ name, email, ipAddress }}
        updateItem={updateItem}
        removeItem={removeItem}
        selectedItemId={selectedItemId}
        setSelectedItemId={setSelectedItemId}
      />
    </div>
  );
}

// --- Admin Panel Component ---
// Now used to add new items and edit the selected one
function AdminPanel({ name, setName, email, setEmail, ipAddress, addItem, selectedItem, updateItem }) {
  const [customText, setCustomText] = useState('Your Text Here');

  const handleItemPropertyChange = (property, value) => {
    if (selectedItem) {
      const numericValue = property === 'opacity' ? parseFloat(value) : parseInt(value, 10);
      updateItem(selectedItem.id, { [property]: numericValue });
    }
  };
  
  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      
      <div className="control-section">
        <h3>User Data</h3>
        <div className="control-group">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="control-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="control-group">
            <label>IP Address</label>
            <p className="ip-display">{ipAddress || 'Fetching...'}</p>
        </div>
      </div>

      <div className="control-section">
        <h3>Add Watermark Item</h3>
        <div className="control-group">
            <input type="text" value={customText} onChange={e => setCustomText(e.target.value)} />
            <button onClick={() => addItem('custom', customText)}>Add Custom Text</button>
        </div>
        <div className="button-grid">
            <button onClick={() => addItem('name')}>Add Name</button>
            <button onClick={() => addItem('email')}>Add Email</button>
            <button onClick={() => addItem('ip')}>Add IP Address</button>
        </div>
      </div>

      {selectedItem && (
        <div className="control-section editing-section">
          <h3>Editing Item</h3>
           <div className="control-group">
            <label htmlFor="rotation">Rotation ({selectedItem.rotation}°)</label>
            <input 
              type="range" 
              id="rotation" 
              min="-180" 
              max="180" 
              value={selectedItem.rotation}
              onChange={(e) => handleItemPropertyChange('rotation', e.target.value)}
              className="slider"
            />
          </div>
          <div className="control-group">
            <label htmlFor="fontSize">Font Size ({selectedItem.fontSize}px)</label>
            <input 
              type="range" 
              id="fontSize" 
              min="10" 
              max="200" 
              value={selectedItem.fontSize}
              onChange={(e) => handleItemPropertyChange('fontSize', e.target.value)}
              className="slider"
            />
          </div>
           <div className="control-group">
            <label htmlFor="opacity">Opacity ({Math.round(selectedItem.opacity * 100)}%)</label>
            <input 
              type="range" 
              id="opacity" 
              min="0" 
              max="1" 
              step="0.01"
              value={selectedItem.opacity}
              onChange={(e) => handleItemPropertyChange('opacity', e.target.value)}
              className="slider"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Livestream Page Component (Corrected) ---
// This version includes dynamic font resizing
function LivestreamPage({ items, sourceData, updateItem, removeItem, selectedItemId, setSelectedItemId }) {
  return (
    <div className="livestream-page">
      <h1>Your Interactive Livestream</h1>
      <div className="video-container" onMouseDown={() => setSelectedItemId(null)}>
        
        <div style={{padding: '56.25% 0 0 0', position: 'relative'}}>
          <iframe 
            src="https://vimeo.com/event/5234535/embed" 
            frameBorder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowFullScreen 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
            title="Vimeo Livestream"
          ></iframe>
        </div>

        {items.map(item => (
          <Rnd
            key={item.id}
            className="watermark-item-wrapper"
            style={{
              border: `2px dashed ${selectedItemId === item.id ? '#4299e1' : 'transparent'}`,
            }}
            size={{ width: item.width, height: item.height }}
            position={{ x: item.x, y: item.y }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedItemId(item.id);
            }}
            onDragStop={(e, d) => {
              updateItem(item.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              const newWidth = parseInt(ref.style.width, 10);
              const newHeight = parseInt(ref.style.height, 10);
              // Auto-adjust font size based on the new height of the box
              const newFontSize = Math.max(12, Math.round(newHeight * 0.4));

              updateItem(item.id, {
                width: `${newWidth}px`,
                height: `${newHeight}px`,
                fontSize: newFontSize,
                ...position,
              });
            }}
            bounds="parent"
          >
            <div 
              className="watermark-content-container"
              style={{ 
                transform: `rotate(${item.rotation}deg)`,
                fontSize: `${item.fontSize}px`,
                opacity: item.opacity
              }}
            >
                <span className="watermark-text">
                    {item.type === 'name' && sourceData.name}
                    {item.type === 'email' && sourceData.email}
                    {item.type === 'ip' && sourceData.ipAddress}
                    {item.type === 'custom' && item.text}
                </span>
                <button 
                  className="remove-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                >
                  <X size={16} />
                </button>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}

export default App;
