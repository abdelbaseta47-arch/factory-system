import React from 'react';

export default function WorkerLogin() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', textAlign: 'center', direction: 'rtl' }}>
      <h1>نظام إدارة المصنع</h1>
      <p>أهلاً بك في واجهة العمال.</p>
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', display: 'inline-block' }}>
        <p>أدخل الكود الخاص بك لتسجيل الدخول:</p>
        <input 
          type="text" 
          placeholder="مثال: 1100" 
          style={{ padding: '10px', fontSize: '16px', marginBottom: '10px', width: '200px' }}
        />
        <br />
        <button style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          دخول
        </button>
      </div>
    </div>
  );
}
