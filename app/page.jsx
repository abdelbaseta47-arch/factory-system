import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export default async function WorkerDashboard({ searchParams }) {
  const params = await searchParams;
  const workerCode = params?.code;
  const currentProject = params?.project;
  const currentTab = params?.tab || 'tasks';
  const selectedDate = params?.date || new Date().toISOString().split('T')[0];
  const requestSubtype = params?.sub || 'loan';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', direction: 'rtl', margin: 0, padding: 0 }}>
      
      {/* ستايل مخصص للتجاوب مع الموبايل (Responsive CSS) */}
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; }
        
        /* إعدادات الموبايل الافتراضية */
        .sidebar {
          position: fixed;
          top: 0;
          right: -320px; /* مخفية بالكامل */
          width: 280px;
          height: 100vh;
          background-color: #1e293b;
          color: #fff;
          padding: 20px;
          display: flex;
          flex-direction: column;
          transition: right 0.3s ease-in-out;
          z-index: 1000;
          overflow-y: auto;
        }
        
        /* تفعيل ظهور القائمة عند الضغط على الزر */
        #menu-toggle:checked ~ .sidebar {
          right: 0;
        }
        
        /* خلفية داكنة عند فتح القائمة بالموبايل */
        .overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
        #menu-toggle:checked ~ .overlay {
          display: block;
        }

        .main-content {
          width: 100%;
          padding: 15px;
        }

        .mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 15px;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .close-btn { display: block; cursor: pointer; font-size: 20px; color: #94a3b8; }
        
        .req-buttons-grid {
          display: grid;
          grid-template-columns: 1fr; /* عمود واحد على الموبايل */
          gap: 10px;
          margin-bottom: 20px;
        }

        /* إعدادات شاشات الكمبيوتر والتابلت الكبير */
        @media (min-width: 768px) {
          .layout-container { display: flex; min-height: 100vh; }
          .sidebar {
            position: static;
            right: 0;
            box-shadow: 4px 0 10px rgba(0,0,0,0.05);
          }
          .overlay { display: none !important; }
          .main-content { flex: 1; padding: 40px; }
          .mobile-header { display: none; }
          .close-btn { display: none; }
          .req-buttons-grid { grid-template-columns: repeat(3, 1fr); /* 3 أعمدة على الكمبيوتر */ }
        }
      `}} />

      {/* 1. مرحلة تسجيل الدخول: بالكود فقط */}
      {!workerCode ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', borderTop: '5px solid #0284c7', textAlign: 'center' }}>
            <h1 style={{ color: '#1e293b', fontSize: '24px', margin: '0 0 10px 0' }}>نظام إدارة المصنع</h1>
            <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 25px 0' }}>أدخل كود العامل للمتابعة</p>

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
                placeholder="مثال: 1100" 
                required 
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '18px', textAlign: 'center', backgroundColor: '#f8fafc', outline: 'none', marginBottom: '20px' }} 
              />
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                تسجيل الدخول
              </button>
            </form>
          </div>
        </div>
      ) : !currentProject ? (
        /* 2. مرحلة اختيار المشروع وتأكيد الحضور */
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px', borderTop: '5px solid #16a34a' }}>
            <h2 style={{ color: '#1e293b', fontSize: '20px', margin: '0 0 8px 0', textAlign: 'center' }}>مرحباً بك، كود: {workerCode}</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 25px 0', textAlign: 'center' }}>الرجاء اختيار المشروع لتسجيل الحضور</p>

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
                <select name="project" required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none' }}>
                  <option value="">-- اضغط للاختيار --</option>
                  <option value="مشروع أبراج المصنع">مشروع أبراج المصنع</option>
                  <option value="مشروع خط الإنتاج الجديد">مشروع خط الإنتاج الجديد</option>
                  <option value="مشروع الصيانة العامة">مشروع الصيانة العامة</option>
                </select>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                تسجيل حضور ودخول النظام
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 3. اللوحة الرئيسية المتجاوبة مع القائمة الجانبية */
        <div>
          {/* المخفي الذي يتحكم في ظهور القائمة بالموبايل */}
          <input type="checkbox" id="menu-toggle" style={{ display: 'none' }} />
          
          {/* التعتيم خلف القائمة عند فتحها بالموبايل */}
          <label htmlFor="menu-toggle" className="overlay"></label>

          <div className="layout-container">
            
            {/* الهيدر الخاص بالموبايل فقط */}
            <div className="mobile-header">
              <label htmlFor="menu-toggle" style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
                ☰ القائمة
              </label>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>كود: {workerCode}</span>
            </div>

            {/* القائمة الجانبية بالطول */}
            <aside className="sidebar">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#38bdf8' }}>العامل: {workerCode}</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>المشروع: {currentProject}</span>
                </div>
                {/* زر إغلاق القائمة في الموبايل */}
                <label htmlFor="menu-toggle" className="close-btn">✖</label>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tasks&date=${selectedDate}`} style={{ padding: '14px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tasks' ? '#0284c7' : 'transparent', color: '#fff' }}>
                  📋 المهام اليومية
                </a>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan`} style={{ padding: '14px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'requests' ? '#0284c7' : 'transparent', color: '#fff' }}>
                  ✍️ تقديم طلب جديد
                </a>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${selectedDate}`} style={{ padding: '14px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tracking' ? '#0284c7' : 'transparent', color: '#fff' }}>
                  📊 متابعة الطلبات
                </a>
              </nav>

              <form action={async () => {
                'use server';
                const { redirect } = await import('next/navigation');
                redirect(`/`);
              }}>
                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '20px' }}>
                  تسجيل خروج
                </button>
              </form>
            </aside>

            {/* المحتوى الرئيسي */}
            <main className="main-content">
              
              {/* شريط الفلتر اليومي */}
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>
                  {currentTab === 'tasks' && 'المهام المطلوبة'}
                  {currentTab === 'requests' && 'نافذة تقديم الطلبات'}
                  {currentTab === 'tracking' && 'سجل ومتابعة الطلبات'}
                </h2>

                <form method="GET" style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
                  <input type="hidden" name="code" value={workerCode} />
                  <input type="hidden" name="project" value={currentProject} />
                  <input type="hidden" name="tab" value={currentTab} />
                  <input type="hidden" name="sub" value={requestSubtype} />
                  <input 
                    type="date" 
                    name="date" 
                    defaultValue={selectedDate} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                  <button type="submit" style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                    فلترة
                  </button>
                </form>
              </div>

              {/* محتوى التابة الأولى: المهام */}
              {currentTab === 'tasks' && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>تاريخ العرض: <strong>{selectedDate}</strong></p>
                  
                  {/* مهام تجريبية */}
                  <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', borderRight: '4px solid #0284c7', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '15px' }}>توريد وتركيب الواجهات الألومنيوم</h4>
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>قيد التنفيذ</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>القطاع الشمالي - الدور الثاني</p>
                  </div>
                </div>
              )}

              {/* محتوى التابة الثانية: تقديم الطلبات */}
              {currentTab === 'requests' && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  
                  {/* الأزارير الثلاثة تتجاوب مع الشاشة (تصبح فوق بعضها بالموبايل وجنب بعض بالكمبيوتر) */}
                  <div className="req-buttons-grid">
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan`} style={{ padding: '12px', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', backgroundColor: requestSubtype === 'loan' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'loan' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>
                      💰 طلب سلفة
                    </a>
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=leave`} style={{ padding: '12px', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', backgroundColor: requestSubtype === 'leave' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'leave' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>
                      🌴 طلب إجازة
                    </a>
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=issue`} style={{ padding: '12px', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', backgroundColor: requestSubtype === 'issue' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'issue' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>
                      ⚠️ إبلاغ عن مشكلة
                    </a>
                  </div>

                  {/* فورم طلب سلفة */}
                  {requestSubtype === 'loan' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const amount = formData.get('amount');
                      const notes = formData.get('notes');
                      const reqDate = formData.get('reqDate');
                      
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
                      redirect(`/?code=${code}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${reqDate}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="reqDate" value={selectedDate} />

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>المبلغ المطلوب (بالريال):</label>
                        <input type="number" name="amount" placeholder="مثال: 500" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>سبب أو تفاصيل السلفة:</label>
                        <textarea name="notes" placeholder="اكتب السبب..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '80px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>إرسال طلب السلفة</button>
                    </form>
                  )}

                  {/* فورم طلب إجازة */}
                  {requestSubtype === 'leave' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const leaveType = formData.get('leaveType');
                      const reason = formData.get('reason');
                      const reqDate = formData.get('reqDate');

                      await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'طلب إجازة', ${'نوع الإجازة: ' + leaveType + ' - السبب: ' + reason}, ${reqDate})`;
                      
                      const { redirect } = await import('next/navigation');
                      redirect(`/?code=${code}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${reqDate}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="reqDate" value={selectedDate} />

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>نوع الإجازة:</label>
                        <select name="leaveType" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                          <option value="إجازة سنوية">إجازة سنوية</option>
                          <option value="إجازة عارضة">إجازة عارضة</option>
                          <option value="إجازة مرضية">إجازة مرضية</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>سبب الإجازة والتفاصيل:</label>
                        <textarea name="reason" placeholder="اكتب السبب..." required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '80px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>إرسال طلب الإجازة</button>
                    </form>
                  )}

                  {/* فورم إبلاغ عن مشكلة */}
                  {requestSubtype === 'issue' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const desc = formData.get('desc');
                      const reqDate = formData.get('reqDate');

                      await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'إبلاغ عن مشكلة', ${desc}, ${reqDate})`;
                      
                      const { redirect } = await import('next/navigation');
                      redirect(`/?code=${code}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${reqDate}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="reqDate" value={selectedDate} />

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>وصف المشكلة أو العطل:</label>
                        <textarea name="desc" placeholder="اشرح المشكلة بالتفصيل..." required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '100px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>إرسال البلاغ للإدارة</button>
                    </form>
                  )}

                </div>
              )}

              {/* محتوى التابة الثالثة: متابعة الطلبات */}
              {currentTab === 'tracking' && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '16px' }}>طلباتك المسجلة بتاريخ: {selectedDate}</h3>

                  <div style={{ marginTop: '15px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#1e293b', display: 'block', marginBottom: '4px', fontSize: '14px' }}>سلفة مالية</strong>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>المبلغ: 500 ريال</span>
                      </div>
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>قيد المراجعة</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>لا توجد طلبات أخرى في هذا التاريخ.</p>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      )}
    </div>
  );
}
