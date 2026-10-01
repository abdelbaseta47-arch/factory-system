import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export default async function WorkerPage({ searchParams }) {
  // استقبال كود العامل من الرابط (طريقة مضمونة 100% ولا تتأثر بالمتصفح)
  const params = await searchParams;
  const workerCode = params?.code;

  // 1. دالة تسجيل الدخول (تحويل العامل للوحة الخاصة به)
  async function handleLogin(formData) {
    'use server';
    const code = formData.get('code');
    if (code) {
      // إنشاء الجداول أوتوماتيكياً لو مش موجودة
      await sql`
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          worker_code VARCHAR(50) NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS requests (
          id SERIAL PRIMARY KEY,
          worker_code VARCHAR(50) NOT NULL,
          req_type VARCHAR(50) NOT NULL,
          details TEXT,
          status VARCHAR(50) DEFAULT 'قيد المراجعة',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await sql`INSERT INTO attendance (worker_code, action_type) VALUES (${code}, 'حضور')`;
      
      // إعادة توجيه الصفحة للوحة العامل برقم الكود
      const { redirect } = await import('next/navigation');
      redirect(`/?code=${code}`);
    }
  }

  // 2. دالة تسجيل الانصراف
  async function handleLogout() {
    'use server';
    const { redirect } = await import('next/navigation');
    redirect(`/`);
  }

  // 3. دالة إرسال الطلبات
  async function submitRequest(formData) {
    'use server';
    const code = formData.get('workerCode');
    const type = formData.get('reqType');
    const details = formData.get('details');
    
    if (code && type && details) {
      await sql`INSERT INTO requests (worker_code, req_type, details) VALUES (${code}, ${type}, ${details})`;
      revalidatePath(`/?code=${code}`);
    }
  }

  // --- إذا لم يتم إدخال الكود (شاشة تسجيل الدخول) ---
  if (!workerCode) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial', textAlign: 'center', direction: 'rtl', maxWidth: '400px', margin: '50px auto' }}>
        <h1 style={{ color: '#0070f3' }}>نظام إدارة المصنع</h1>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <form action={handleLogin}>
            <p style={{ fontWeight: 'bold', fontSize: '16px' }}>أدخل كود العامل الخاص بك:</p>
            <input 
              type="number" 
              name="code" 
              placeholder="مثال: 1100" 
              required 
              style={{ padding: '12px', fontSize: '18px', width: '90%', marginBottom: '15px', textAlign: 'center', borderRadius: '5px', border: '1px solid #ccc' }} 
            />
            <button type="submit" style={{ padding: '12px', width: '100%', fontSize: '18px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              دخول لوحة العامل
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- لوحة التحكم الخاصة بالعامل (بعد تسجيل الدخول) ---
  let myRequests = [];
  try {
    const res = await sql`SELECT * FROM requests WHERE worker_code = ${workerCode} ORDER BY created_at DESC LIMIT 5`;
    myRequests = res.rows;
  } catch (e) {}

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '18px' }}>أهلاً بك، كود: <span style={{ color: '#0070f3' }}>{workerCode}</span></h2>
        <form action={handleLogout}>
          <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            خروج
          </button>
        </form>
      </div>

      <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#28a745', fontSize: '16px' }}>تقديم طلب جديد (سلفة / إجازة)</h3>
        <form action={submitRequest}>
          <input type="hidden" name="workerCode" value={workerCode} />
          <select name="reqType" style={{ padding: '10px', width: '100%', marginBottom: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}>
            <option value="سلفة">طلب سلفة</option>
            <option value="إجازة">طلب إجازة</option>
            <option value="مشكلة">إبلاغ عن عطل / مشكلة</option>
          </select>
          <textarea name="details" placeholder="اكتب التفاصيل أو المبلغ هنا..." required style={{ padding: '10px', width: '100%', height: '80px', marginBottom: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical' }}></textarea>
          <button type="submit" style={{ padding: '10px', width: '100%', fontSize: '16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            إرسال للإدارة
          </button>
        </form>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#333' }}>سجل طلباتك السابقة:</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {myRequests.length > 0 ? myRequests.map((req, i) => {
            const reqTime = new Date(req.created_at + 'Z').toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'short', timeStyle: 'short' });
            return (
              <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid #ccc', fontSize: '14px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span><strong>{req.req_type}:</strong> {req.details}</span>
                  <span style={{ color: req.status === 'مقبول' ? 'green' : req.status === 'مرفوض' ? 'red' : 'orange', fontWeight: 'bold' }}>{req.status}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#888' }}>{reqTime}</span>
              </li>
            );
          }) : (
            <li style={{ color: '#666', fontSize: '14px' }}>لم تقم بإرسال أي طلبات حتى الآن.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
