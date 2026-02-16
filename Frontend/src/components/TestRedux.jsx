import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  increment, 
  decrement, 
  incrementByAmount, 
  setMessage,
  setUser 
} from '../store/slices/testSlice';

function TestRedux() {
  const dispatch = useDispatch();
  const { value, message, user, loading } = useSelector((state) => state.test);

  const handleIncrementByAmount = () => {
    dispatch(incrementByAmount(5));
  };

  const handleSetUser = () => {
    dispatch(setUser({ name: "John Doe", email: "john@example.com" }));
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #4CAF50', 
      margin: '20px',
      borderRadius: '10px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{ color: '#4CAF50' }}>🧪 Redux Test Component</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Counter: <span style={{ color: '#2196F3' }}>{value}</span></h3>
        <p>Message: <strong>{message}</strong></p>
        {user && (
          <div>
            <p>User: {user.name} - {user.email}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => dispatch(increment())}
          style={buttonStyle('#4CAF50')}
        >
          Increment
        </button>
        
        <button 
          onClick={() => dispatch(decrement())}
          style={buttonStyle('#f44336')}
        >
          Decrement
        </button>
        
        <button 
          onClick={handleIncrementByAmount}
          style={buttonStyle('#FF9800')}
        >
          +5
        </button>
        
        <button 
          onClick={() => dispatch(setMessage("Redux Working Perfectly! ✅"))}
          style={buttonStyle('#2196F3')}
        >
          Change Message
        </button>
        
        <button 
          onClick={handleSetUser}
          style={buttonStyle('#9C27B0')}
        >
          Set User
        </button>
      </div>
    </div>
  );
}

// Button style object
const buttonStyle = (color) => ({
  backgroundColor: color,
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'opacity 0.3s',
  ':hover': {
    opacity: 0.8
  }
});

export default TestRedux;