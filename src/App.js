// App.js

import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

import './App.css';

// --- Main App Component (Router is now in index.js) ---
function App() {
  return (
    <div className="App">
      <Routes>
        {/* Redirect to a sample event page for demonstration */}
        <Route path="/" element={<Navigate to="/event/sample-event/admin" replace />} />
        {/* The new path-based routes */}
        <Route path="/event/:eventId/admin" element={<AdminPage />} />
        <Route path="/event/:eventId/watch" element={<ViewerPage />} />
      </Routes>
    </div>
  );
}

// --- Admin Page Component ---
function AdminPage() {
  // Get the eventId from the URL path
  const { eventId } = useParams();

  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [ipAddress, setIpAddress] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        e.preventDefault();
        removeItem(selectedItemId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItemId, items]); // Added items to dependency array

  useEffect(() => {
    if (!eventId) return;
    const eventDocRef = doc(db, 'events', eventId);
    const unsubscribe = onSnapshot(eventDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setItems(data.items || []);
        setName(data.vimeoEventName || data.name || 'John Doe');
        setEmail(data.email || 'john.doe@example.com');
      } else {
        console.log("No such document! Creating one for event:", eventId);
        setDoc(eventDocRef, { vimeoEventId: eventId, items: [], name: 'John Doe', email: 'john.doe@example.com' });
      }
    });
    return () => unsubscribe();
  }, [eventId]);

  const saveDataToFirestore = (newItems, newName, newEmail) => {
    if (!eventId) return;
    const eventDocRef = doc(db, 'events', eventId);
    const dataToSave = {
        items: newItems,
        name: newName,
        email: newEmail,
    };
    // Note: We don't want to overwrite the vimeoEventName field here
    setDoc(eventDocRef, dataToSave, { merge: true }).catch(error => {
        console.error("Error writing document: ", error);
    });
  };

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const axios = await import('axios');
        const response = await axios.get('https://api.ipify.org?format=json');
        setIpAddress(response.data.ip);
      } catch (error) {
        console.error("Could not fetch IP address:", error);
        setIpAddress("Unavailable");
      }
    };
    fetchIp();
  }, []);

  const selectedItem = items.find(item => item.id === selectedItemId);

  const addItem = (type, text = '') => {
    const newItem = {
      id: crypto.randomUUID(), type, text, x: 20, y: 20, width: 250, height: 50,
      rotation: 0, fontSize: 22, opacity: 1,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setSelectedItemId(newItem.id);
    saveDataToFirestore(newItems, name, email);
  };

  const updateItem = (id, newProps) => {
    const newItems = items.map(item => (item.id === id ? { ...item, ...newProps } : item));
    setItems(newItems);
    saveDataToFirestore(newItems, name, email);
  };

  const removeItem = (id) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    setSelectedItemId(null);
    saveDataToFirestore(newItems, name, email);
  };

  const handleNameChange = (newName) => {
      setName(newName);
      saveDataToFirestore(items, newName, email);
  }

  const handleEmailChange = (newEmail) => {
      setEmail(newEmail);
      saveDataToFirestore(items, name, newEmail);
  }

  return (
    <>
      <AdminPanel
        name={name} setName={handleNameChange} email={email} setEmail={handleEmailChange}
        ipAddress={ipAddress} addItem={addItem} selectedItem={selectedItem} updateItem={updateItem}
      />
      <LivestreamView
        items={items} sourceData={{ name, email, ipAddress }} updateItem={updateItem}
        removeItem={removeItem} selectedItemId={selectedItemId}
        setSelectedItemId={setSelectedItemId} isAdmin={true}
      />
    </>
  );
}

// --- Viewer Page Component ---
function ViewerPage() {
    const { eventId } = useParams();
    const [items, setItems] = useState([]);
    const [sourceData, setSourceData] = useState({ name: '', email: '', ipAddress: 'Unavailable' });

    useEffect(() => {
        if (!eventId) return;
        const eventDocRef = doc(db, 'events', eventId);
        const unsubscribe = onSnapshot(eventDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setItems(data.items || []);
                setSourceData({ name: data.name || '', email: data.email || '', ipAddress: 'Unavailable' });
            } else {
                console.log("Event not found!");
            }
        });
        return () => unsubscribe();
    }, [eventId]);

    return (
        <LivestreamView
            items={items} sourceData={sourceData} isAdmin={false}
        />
    );
}


// --- Admin Panel Component ---
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
            <label>IP Address (Visible to You)</label>
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
            <input type="range" id="rotation" min="-180" max="180" value={selectedItem.rotation || 0}
              onChange={(e) => handleItemPropertyChange('rotation', e.target.value)} className="slider" />
          </div>
          <div className="control-group">
            <label htmlFor="fontSize">Font Size ({selectedItem.fontSize}px)</label>
            <input type="range" id="fontSize" min="10" max="200" value={selectedItem.fontSize || 22}
              onChange={(e) => handleItemPropertyChange('fontSize', e.target.value)} className="slider" />
          </div>
           <div className="control-group">
            <label htmlFor="opacity">Opacity ({Math.round((selectedItem.opacity || 1) * 100)}%)</label>
            <input type="range" id="opacity" min="0" max="1" step="0.01" value={selectedItem.opacity || 1}
              onChange={(e) => handleItemPropertyChange('opacity', e.target.value)} className="slider" />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable Livestream View Component ---
function LivestreamView({ items, sourceData, updateItem, removeItem, selectedItemId, setSelectedItemId, isAdmin }) {
  const { eventId } = useParams();
  const [vimeoEventId, setVimeoEventId] = useState(eventId); // Use the eventId from the URL by default

  useEffect(() => {
    if (!eventId) return;
    const docRef = doc(db, 'events', eventId);
    getDoc(docRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().vimeoEventId) {
            setVimeoEventId(docSnap.data().vimeoEventId);
        }
    });
  }, [eventId]);

  return (
    <div className="livestream-page">
      <h1>Your Interactive Livestream</h1>
      <div className="video-container" onMouseDown={() => isAdmin && setSelectedItemId(null)}>
        <div style={{padding: '56.25% 0 0 0', position: 'relative'}}>
          <iframe 
            src={`https://vimeo.com/event/${vimeoEventId}/embed`}
            frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
            title="Vimeo Livestream"
          ></iframe>
        </div>
        {items.map(item => (
          <Rnd
            key={item.id} className="watermark-item-wrapper"
            style={{ border: isAdmin && selectedItemId === item.id ? '2px dashed #4299e1' : 'transparent' }}
            size={{ width: item.width, height: item.height }}
            position={{ x: item.x, y: item.y }}
            onMouseDown={(e) => { if (isAdmin) { e.stopPropagation(); setSelectedItemId(item.id); } }}
            onDragStop={isAdmin ? (e, d) => updateItem(item.id, { x: d.x, y: d.y }) : undefined}
            onResizeStop={isAdmin ? (e, dir, ref, delta, pos) => updateItem(item.id, { width: ref.style.width, height: ref.style.height, ...pos }) : undefined}
            bounds="parent" disableDragging={!isAdmin} enableResizing={isAdmin}
          >
            <div className="watermark-content-container"
              style={{ transform: `rotate(${item.rotation}deg)`, fontSize: `${item.fontSize}px`, opacity: item.opacity }}
            >
                <span className="watermark-text">
                    {item.type === 'name' && sourceData.name}
                    {item.type === 'email' && sourceData.email}
                    {item.type === 'ip' && sourceData.ipAddress}
                    {item.type === 'custom' && item.text}
                </span>
                {isAdmin && (
                    <button className="remove-button" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>
                      <X size={16} />
                    </button>
                )}
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}

export default App;
