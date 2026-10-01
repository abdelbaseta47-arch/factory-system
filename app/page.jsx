import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export default async function WorkerDashboard({ searchParams }) {
  const params = await searchParams;
  const workerCode = params?.code;
  const currentProject = params?.project;
  const currentTab = params?.tab || 'tasks';
  const selectedDate = params?.date || new Date().toISOString().split('T')[0];
  const requestSubtype = params?.sub || 'loan'; // نوع الطلب الفرعي داخل تابة الطلبات

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Cairo, Tahoma, Arial, sans-serif', direction: 'rtl', margin: 0, padding: 0 }}>
      
      {/* 1. مرحلة تسجيل الدخول: بالكود فقط */}
      {!workerCode ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', borderTop: '6px solid #0284c7', textAlign: 'center' }}>
            <h1 style={{ color: '#1e293b', fontSize: '26px', margin: '0 0 10px 0' }}>نظام إدارة المصنع</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 25px 0' }}>أدخل كود العامل للمتابعة</p>

            <form action={async (formData) => {
              'use server';
              const code = formData.get('code');
              if (code) {
                const { redirect } = await import('next/navigation');
                redirect(`/?code=${code}`);
              }
            }}>
              <input 
                type="number" 
                name="code" 
                placeholder="أدخل الكود (مثال: 1100)" 
                required 
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '18px', textAlign: 'center', backgroundColor: '#f8fafc', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }} 
              />
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                تسجيل الدخول
              </button>
            </form>
          </div>
        </div>
      ) : !currentProject ? (
        /* 2. مرحلة اختيار المشروع وتأكيد الحضور بعد إدخال الكود */
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '450px', borderTop: '6px solid #16a34a' }}>
            <h2 style={{ color: '#1e293b', fontSize: '22px', margin: '0 0 8px 0', textAlign: 'center' }}>مرحباً بك، كود: {workerCode}</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 25px 0', textAlign: 'center' }}>الرجاء اختيار المشروع لتسجيل الحضور وبدء العمل</p>

            <form action={async (formData) => {
              'use server';
              const code = formData.get('code');
              const project = formData.get('project');
              if (code && project) {
                await sql`
                  CREATE TABLE IF NOT EXISTS worker_sessions (
                    id SERIAL PRIMARY KEY,
                    worker_code VARCHAR(50),
                    project_name VARCHAR(100),
                    login_date DATE DEFAULT CURRENT_DATE
                  );
                `;
                await sql`INSERT INTO worker_sessions (worker_code, project_name) VALUES (${code}, ${project})`;
                
                const { redirect } = await import('next/navigation');
                redirect(`/?code=${code}&project=${encodeURIComponent(project)}&tab=tasks`);
              }
            }}>
              <input type="hidden" name="code" value={workerCode} />
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>اختر المشروع الحالي:</label>
                <select name="project" required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none' }}>
                  <option value="">-- اضغط للاختيار --</option>
                  <option value="مشروع أبراج المصنع">مشروع أبراج المصنع</option>
                  <option value="مشروع خط الإنتاج الجديد">مشروع خط الإنتاج الجديد</option>
                  <option value="مشروع الصيانة العامة">مشروع الصيانة العامة</option>
                </select>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                تسجيل حضور ودخول النظام
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 3. اللوحة الرئيسية الاحترافية مع القائمة الجانبية (Sidebar) */
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          
          {/* القائمة الجانبية بالطول (Sidebar) */}
          <aside style={{ width: '280px', backgroundColor: '#1e293b', color: '#fff', padding: '30px 20px', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#38bdf8' }}>عامل كود: {workerCode}</h3>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>المشروع: {currentProject}</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tasks&date=${selectedDate}`} style={{ padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tasks' ? '#0284c7' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}>
                📋 المهام اليومية
              </a>
              <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan`} style={{ padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'requests' ? '#0284c7' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}>
                ✍️ تقديم طلبات جديدة
              </a>
              <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${selectedDate}`} style={{ padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tracking' ? '#0284c7' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}>
                📊 متابعة الطلبات
              </a>
            </nav>

            <form action={async () => {
              'use server';
              const { redirect } = await import('next/navigation');
              redirect('/');
            }}>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                تسجيل خروج
              </button>
            </form>
          </aside>

          {/* المحتوى الرئيسي */}
          <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
            
            {/* شريط الفلتر اليومي */}
            <div style={{ backgroundColor: '#ffffff', padding: '15px 25px', borderRadius: '14px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>
                  {currentTab === 'tasks' && 'المهام المطلوبة'}
                  {currentTab === 'requests' && 'نافذة تقديم الطلبات'}
                  {currentTab === 'tracking' && 'سجل ومتابعة الطلبات'}
                </h2>
              </div>

              <form method="GET" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="hidden" name="code" value={workerCode} />
                <input type="hidden" name="project" value={currentProject} />
                <input type="hidden" name="tab" value={currentTab} />
                <input type="hidden" name="sub" value={requestSubtype} />
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>التاريخ:</span>
                <input 
                  type="date" 
                  name="date" 
                  defaultValue={selectedDate} 
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' }}
                />
                <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  فلترة التاريخ
                </button>
              </form>
            </div>

            {/* محتوى التابة الأولى: المهام */}
            {currentTab === 'tasks' && (
              <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', fontSize: '15px', marginTop: 0 }}>عرض المهام المخصصة لك في تاريخ: <strong>{selectedDate}</strong></p>
                <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                  <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', borderRight: '5px solid #0284c7', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>توريد وتركيب الواجهات الألومنيوم</h4>
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>قيد التنفيذ</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>القطاع الشمالي - الدور الثاني</p>
                  </div>
                </div>
              </div>
            )}

            {/* محتوى التابة الثانية: تقديم الطلبات (أزارير ثابتة ومفصلة بدل القائمة المنسدلة) */}
            {currentTab === 'requests' && (
              <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', fontSize: '15px', marginTop: 0 }}>اختر نوع الطلب المراد إرساله للإدارة:</p>
                
                {/* الأزارير الثلاثة الثابتة جنب بعض */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', margin: '20px 0 30px 0' }}>
                  <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan`} style={{ padding: '15px', textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', backgroundColor: requestSubtype === 'loan' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'loan' ? '#fff' : '#334155', border: '1px solid #cbd5e1', transition: 'all 0.2s' }}>
                    💰 طلب سلفة مالية
                  </a>
                  <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=leave`} style={{ padding: '15px', textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: requestSubtype === 'leave' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'leave' ? '#fff' : '#334155', border: '1px solid #cbd5e1', transition: 'all 0.2s' }}>
                    🌴 طلب إجازة
                  </a>
                  <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=issue`} style={{ padding: '15px', textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: requestSubtype === 'issue' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'issue' ? '#fff' : '#334155', border: '1px solid #cbd5e1', transition: 'all 0.2s' }}>
                    ⚠️ إبلاغ عن مشكلة/عطل
                  </a>
                </div>

                {/* فورم تفاصيل طلب السلفة */}
                {requestSubtype === 'loan' && (
                  <form action={async (formData) => {
                    'use server';
                    const code = formData.get('workerCode');
                    const amount = formData.get('amount');
                    const notes = formData.get('notes');
                    const reqDate = formData.get('reqDate');
                    const proj = formData.get('proj');

                    await sql`
                      CREATE TABLE IF NOT EXISTS requests (
                        id SERIAL PRIMARY KEY,
                        worker_code VARCHAR(50),
                        req_type VARCHAR(50),
                        details TEXT,
                        status VARCHAR(50) DEFAULT 'قيد المراجعة',
                        request_date DATE
                      );
                    `;
                    await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'سلفة مالية', ${'المبلغ: ' + amount + ' ريال - ملاحظات: ' + notes}, ${reqDate})`;
                    
                    const { redirect } = await import('next/navigation');
                    redirect(`/?code=${code}&project=${encodeURIComponent(proj)}&tab=tracking&date=${reqDate}`);
                  }}>
                    <input type="hidden" name="workerCode" value={workerCode} />
                    <input type="hidden" name="proj" value={currentProject} />
                    <input type="hidden" name="reqDate" value={selectedDate} />

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>المبلغ المطلوب (بالريال):</label>
                      <input type="number" name="amount" placeholder="مثال: 500" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>سبب أو تفاصيل السلفة:</label>
                      <textarea name="notes" placeholder="اكتب سبب السلفة..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '80px', outline: 'none' }}></textarea>
                    </div>
                    <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إرسال طلب السلفة</button>
                  </form>
                )}

                {/* فورم تفاصيل طلب الإجازة */}
                {requestSubtype === 'leave' && (
                  <form action={async (formData) => {
                    'use server';
                    const code = formData.get('workerCode');
                    const leaveType = formData.get('leaveType');
                    const reason = formData.get('reason');
                    const reqDate = formData.get('reqDate');
                    const proj = formData.get('proj');

                    await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'طلب إجازة', ${'نوع الإجازة: ' + leaveType + ' - السبب: ' + reason}, ${reqDate})`;
                    
                    const { redirect } = await import('next/navigation');
                    redirect(`/?code=${code}&project=${encodeURIComponent(proj)}&tab=tracking&date=${reqDate}`);
                  }}>
                    <input type="hidden" name="workerCode" value={workerCode} />
                    <input type="hidden" name="proj" value={currentProject} />
                    <input type="hidden" name="reqDate" value={selectedDate} />

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>نوع الإجازة:</label>
                      <select name="leaveType" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                        <option value="إجازة سنوية">إجازة سنوية</option>
                        <option value="إجازة عارضة">إجازة عارضة</option>
                        <option value="إجازة مرضية">إجازة مرضية</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>سبب الإجازة والتفاصيل:</label>
                      <textarea name="reason" placeholder="اكتب سبب طلب الإجازة..." required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '80px', outline: 'none' }}></textarea>
                    </div>
                    <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إرسال طلب الإجازة</button>
                  </form>
                )}

                {/* فورم تفاصيل إبلاغ عن مشكلة */}
                {requestSubtype === 'issue' && (
                  <form action={async (formData) => {
                    'use server';
                    const code = formData.get('workerCode');
                    const desc = formData.get('desc');
                    const reqDate = formData.get('reqDate');
                    const proj = formData.get('proj');

                    await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'إبلاغ عن مشكلة', ${desc}, ${reqDate})`;
                    
                    const { redirect } = await import('next/navigation');
                    redirect(`/?code=${code}&project=${encodeURIComponent(proj)}&tab=tracking&date=${reqDate}`);
                  }}>
                    <input type="hidden" name="workerCode" value={workerCode} />
                    <input type="hidden" name="proj" value={currentProject} />
                    <input type="hidden" name="reqDate" value={selectedDate} />

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>وصف المشكلة أو العطل:</label>
                      <textarea name="desc" placeholder="اشرح المشكلة بالتفصيل..." required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '100px', outline: 'none' }}></textarea>
                    </div>
                    <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إرسال البلاغ للإدارة</button>
                  </form>
                )}

              </div>
            )}

            {/* محتوى التابة الثالثة: متابعة الطلبات حسب تاريخ الفلتر */}
            {currentTab === 'tracking' && (
              <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '18px' }}>طلباتك المسجلة لتاريخ: {selectedDate}</h3>

                {(() => {
                  let requestsList = [];
                  try {
                    // سيتم جلب الطلبات الخاصة بالعامل والتاريخ المحدد
                  } catch(e) {}
                  return (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <strong style={{ color: '#1e293b', display: 'block', marginBottom: '4px', fontSize: '15px' }}>سلفة مالية</strong>
                          <span style={{ color: '#64748b', fontSize: '14px' }}>المبلغ: 500 ريال - ملاحظات: لشهر أكتوبر</span>
                        </div>
                        <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>قيد المراجعة</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginTop: '30px' }}>لا توجد طلبات أخرى مرسلة في هذا التاريخ المحدد.</p>
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
