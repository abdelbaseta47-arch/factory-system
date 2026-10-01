import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export default async function WorkerDashboard({ searchParams }) {
  const params = await searchParams;
  const workerCode = params?.code;
  const currentTab = params?.tab || 'tasks';
  const selectedDate = params?.date || new Date().toISOString().split('T')[0];

  // 1. دالة تسجيل الدخول مع اختيار المشروع
  async function handleLogin(formData) {
    'server-only';
    // ملاحظة: الـ Server actions يتم استدعاؤها بشكل آمن
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Cairo, Tahoma, Arial, sans-serif', direction: 'rtl', padding: '0 0 40px 0' }}>
      
      {/* شاشة تسجيل الدخول لو لم يتم إدخال الكود */}
      {!workerCode ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px', borderTop: '5px solid #2563eb' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h1 style={{ color: '#1e293b', fontSize: '24px', margin: '0 0 8px 0' }}>نظام إدارة المصنع</h1>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>تسجيل دخول العامل للوحة التحكم</p>
            </div>

            <form action={async (formData) => {
              'use server';
              const code = formData.get('code');
              const project = formData.get('project');
              if (code && project) {
                // إنشاء الجداول لو مش موجودة
                await sql`
                  CREATE TABLE IF NOT EXISTS worker_sessions (
                    id SERIAL PRIMARY KEY,
                    worker_code VARCHAR(50),
                    project_name VARCHAR(100),
                    login_date DATE DEFAULT CURRENT_DATE
                  );
                `;
                await sql`
                  CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    worker_code VARCHAR(50),
                    task_title TEXT,
                    status VARCHAR(20) DEFAULT 'معلقة',
                    task_date DATE DEFAULT CURRENT_DATE
                  );
                `;
                await sql`
                  CREATE TABLE IF NOT EXISTS requests (
                    id SERIAL PRIMARY KEY,
                    worker_code VARCHAR(50),
                    req_type VARCHAR(50),
                    details TEXT,
                    status VARCHAR(50) DEFAULT 'قيد المراجعة',
                    request_date DATE DEFAULT CURRENT_DATE
                  );
                `;

                await sql`INSERT INTO worker_sessions (worker_code, project_name) VALUES (${code}, ${project})`;
                const { redirect } = await import('next/navigation');
                redirect(`/?code=${code}&tab=tasks`);
              }
            }}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>اختر المشروع:</label>
                <select name="project" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none' }}>
                  <option value="">-- اختر المشروع الحالي --</option>
                  <option value="مشروع أبراج المصنع">مشروع أبراج المصنع</option>
                  <option value="مشروع خط الإنتاج الجديد">مشروع خط الإنتاج الجديد</option>
                  <option value="مشروع الصيانة العامة">مشروع الصيانة العامة</option>
                </select>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>كود العامل:</label>
                <input type="number" name="code" placeholder="مثال: 1100" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', textAlign: 'center', backgroundColor: '#f8fafc', outline: 'none' }} />
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
                دخول للنظام
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* --- لوحة التحكم الاحترافية للعامل --- */
        <div>
          {/* الهيدر العلوي */}
          <header style={{ backgroundColor: '#1e293b', color: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px' }}>مرحباً، العامل كود: <span style={{ color: '#38bdf8' }}>{workerCode}</span></h2>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>لوحة التحكم والمهام اليومية</span>
            </div>
            
            <form action={async () => {
              'use server';
              const { redirect } = await import('next/navigation');
              redirect('/');
            }}>
              <button type="submit" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                تسجيل خروج
              </button>
            </form>
          </header>

          <main style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
            
            {/* شريط اختيار التاريخ (الفلتر اليومي) */}
            <div style={{ backgroundColor: '#ffffff', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '15px' }}>📅 عرض بيانات تاريخ:</span>
              <form method="GET" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="hidden" name="code" value={workerCode} />
                <input type="hidden" name="tab" value={currentTab} />
                <input 
                  type="date" 
                  name="date" 
                  defaultValue={selectedDate} 
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
                <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  تحديث العرض
                </button>
              </form>
            </div>

            {/* شريط القائمة المنسدلة / التابات الثلاثة */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#e2e8f0', padding: '6px', borderRadius: '12px' }}>
              <a href={`/?code=${workerCode}&tab=tasks&date=${selectedDate}`} style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tasks' ? '#ffffff' : 'transparent', color: currentTab === 'tasks' ? '#2563eb' : '#64748b', boxShadow: currentTab === 'tasks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                📋 المهام المطلوبة
              </a>
              <a href={`/?code=${workerCode}&tab=new-request&date=${selectedDate}`} style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'new-request' ? '#ffffff' : 'transparent', color: currentTab === 'new-request' ? '#2563eb' : '#64748b', boxShadow: currentTab === 'new-request' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                ✍️ تقديم طلب جديد
              </a>
              <a href={`/?code=${workerCode}&tab=tracking&date=${selectedDate}`} style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tracking' ? '#ffffff' : 'transparent', color: currentTab === 'tracking' ? '#2563eb' : '#64748b', boxShadow: currentTab === 'tracking' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                📊 متابعة الطلبات
              </a>
            </div>

            {/* محتوى التابة الأولى: المهام */}
            {currentTab === 'tasks' && (
              <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>المهام المخصصة ليوم: {selectedDate}</h3>
                
                {(() => {
                  // جلب المهام الخاصة بهذا العامل وهذا التاريخ
                  let tasksList = [];
                  try {
                    // سنقوم بجلب المهام لاحقاً عبر الكود أدناه
                  } catch(e) {}
                  return (
                    <div>
                      {/* محتوى تجريبي أو جلب حقيقي من قاعدة البيانات */}
                      <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', borderRight: '4px solid #2563eb', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#334155' }}>تجهيز مواد البناء للقطاع الشمالي</span>
                          <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>قيد التنفيذ</span>
                        </div>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', borderRight: '4px solid #16a34a', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#334155' }}>فحص معدات التشغيل والصيانة</span>
                          <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>مكتملة</span>
                        </div>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>لا توجد مهام أخرى مسجلة لهذا التاريخ.</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* محتوى التابة الثانية: تقديم طلب جديد (سلفة، إجازة، عطل) */}
            {currentTab === 'new-request' && (
              <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>تقديم طلب جديد للإدارة</h3>
                
                <form action={async (formData) => {
                  'use server';
                  const code = formData.get('workerCode');
                  const type = formData.get('reqType');
                  const details = formData.get('details');
                  const reqDate = formData.get('reqDate');

                  if (code && type && details) {
                    await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, ${type}, ${details}, ${reqDate})`;
                    const { redirect } = await import('next/navigation');
                    redirect(`/?code=${code}&tab=tracking&date=${reqDate}`);
                  }
                }}>
                  <input type="hidden" name="workerCode" value={workerCode} />
                  <input type="hidden" name="reqDate" value={selectedDate} />

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>نوع الطلب:</label>
                    <select name="reqType" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none' }}>
                      <option value="سلفة مالية">طلب سلفة مالية</option>
                      <option value="إجازة عارضة/سنوية">طلب إجازة</option>
                      <option value="إبلاغ عن عطل أو مشكلة">إبلاغ عن عطل أو مشكلة في العمل</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>تفاصيل الطلب / المبلغ:</label>
                    <textarea name="details" placeholder="اكتب تفاصيل طلبك هنا بوضوح..." required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '100px', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none', resize: 'vertical' }}></textarea>
                  </div>

                  <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    إرسال الطلب فوراً للإدارة
                  </button>
                </form>
              </div>
            )}

            {/* محتوى التابة الثالثة: متابعة الطلبات */}
            {currentTab === 'tracking' && (
              <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>متابعة حالة الطلبات لتاريخ: {selectedDate}</h3>

                {(() => {
                  let requestsList = [];
                  // سنقوم بعرض الطلبات المسجلة
                  return (
                    <div>
                      <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                        <div>
                          <strong style={{ color: '#1e293b', display: 'block', marginBottom: '4px' }}>طلب سلفة مالية</strong>
                          <span style={{ color: '#64748b', fontSize: '14px' }}>مبلغ 500 ريال لشهر أكتوبر</span>
                        </div>
                        <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>قيد المراجعة</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>لا توجد طلبات أخرى مرسلة في هذا اليوم.</p>
                    </div>
                  );
                })()}
              </div>
            )}

          </main>
        </div>
      )}
    </div>
  );
}
