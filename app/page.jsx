import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export default async function WorkerPage() {
  // دالة إرسال البيانات وإنشاء الجدول تلقائياً
  async function recordAttendance(formData) {
    'use server';
    const code = formData.get('workerCode');
    
    if (code) {
      // 1. الكود هينشئ الجدول بنفسه لو مكنش موجود (عشان نتخطى خطأ Vercel)
      await sql`
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          worker_code VARCHAR(50) NOT NULL,
          login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      // 2. تسجيل الحضور فوراً
      await sql`INSERT INTO attendance (worker_code) VALUES (${code})`;
      revalidatePath('/'); // تحديث الصفحة
    }
  }

  // محاولة جلب البيانات (مع حماية لو الجدول لسه متعملش)
  let rows = [];
  try {
    const result = await sql`SELECT * FROM attendance ORDER BY login_time DESC LIMIT 5`;
    rows = result.rows;
  } catch (e) {
    // لو الجدول لسه متمش إنشاؤه، مش هيعمل خطأ، هيعرض بس القائمة فاضية
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', textAlign: 'center', direction: 'rtl', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ color: '#0070f3' }}>نظام المصنع</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <form action={recordAttendance}>
          <p style={{ fontWeight: 'bold' }}>أدخل كود العامل الخاص بك:</p>
          <input 
            type="number" 
            name="workerCode"
            placeholder="مثال: 1100" 
            required
            style={{ padding: '10px', fontSize: '18px', marginBottom: '15px', width: '90%', textAlign: 'center', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '12px 20px', fontSize: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
            تسجيل حضور
          </button>
        </form>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'right', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '5px' }}>
        <h3 style={{ color: '#333', fontSize: '16px' }}>آخر حركات مسجلة:</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {rows.length > 0 ? rows.map((row, index) => (
            <li key={index} style={{ padding: '8px 0', borderBottom: '1px solid #ccc', fontSize: '14px' }}>
              كود العامل: <strong>{row.worker_code}</strong> | الوقت: {new Date(row.login_time).toLocaleTimeString('ar-SA')}
            </li>
          )) : (
            <li style={{ fontSize: '14px', color: '#666' }}>لا توجد حركات حتى الآن. تسجيلك الأول سيقوم بإنشاء القاعدة أوتوماتيكياً!</li>
          )}
        </ul>
      </div>
    </div>
  );
}
