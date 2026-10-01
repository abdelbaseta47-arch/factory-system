import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export default async function WorkerDashboard({ searchParams }) {
  const params = await searchParams;
  const workerCode = params?.code;
  const currentProject = params?.project;
  const currentTab = params?.tab || 'tasks';
  const selectedDate = params?.date || new Date().toISOString().split('T')[0];
  const requestSubtype = params?.sub || 'loan';
  const lang = params?.lang || 'ar';

  const t = {
    ar: {
      title: "نظام إدارة المصنع",
      loginPrompt: "أدخل كود العامل للمتابعة",
      codePlaceholder: "أدخل الكود (مثال: 1100)",
      loginBtn: "تسجيل الدخول",
      welcome: "مرحباً بك، كود:",
      selectProj: "الرجاء اختيار المشروع لتسجيل الحضور وبدء العمل",
      projLabel: "اختر المشروع الحالي:",
      selectProjOption: "-- اضغط للاختيار --",
      proj1: "مشروع أبراج المصنع",
      proj2: "مشروع خط الإنتاج الجديد",
      proj3: "مشروع الصيانة العامة",
      startWorkBtn: "تسجيل حضور ودخول النظام",
      tasksTab: "📋 المهام اليومية",
      requestsTab: "✍️ تقديم طلبات جديدة",
      trackingTab: "📊 متابعة الطلبات",
      logoutBtn: "تسجيل خروج",
      dateLabel: "التاريخ:",
      filterBtn: "فلترة",
      tasksTitle: "المهام المطلوبة",
      noTasks: "لا توجد مهام مسجلة لهذا التاريخ.",
      requestsTitle: "نافذة تقديم الطلبات",
      loanBtn: "💰 طلب سلفة مالية",
      leaveBtn: "🌴 طلب إجازة",
      issueBtn: "⚠️️ إبلاغ عن عطل / مشكلة",
      amountLabel: "المبلغ المطلوب (بالريال):",
      notesLabel: "سبب أو تفاصيل السلفة:",
      sendLoan: "إرسال طلب السلفة",
      leaveTypeLabel: "نوع الإجازة:",
      annualLeave: "إجازة سنوية",
      casualLeave: "إجازة عارضة",
      sickLeave: "إجازة مرضية",
      leaveReasonLabel: "سبب الإجازة والتفاصيل:",
      sendLeave: "إرسال طلب الإجازة",
      issueDescLabel: "وصف المشكلة أو العطل:",
      sendIssue: "إرسال البلاغ للإدارة",
      trackingTitle: "سجل ومتابعة الطلبات",
      noRequests: "لا توجد طلبات مرسلة في هذا التاريخ.",
      statusPending: "قيد المراجعة",
      menuToggle: "☰ القائمة"
    },
    en: {
      title: "Factory Management System",
      loginPrompt: "Enter worker code to continue",
      codePlaceholder: "Enter code (e.g. 1100)",
      loginBtn: "Login",
      welcome: "Welcome, Code:",
      selectProj: "Please select project to check in and start work",
      projLabel: "Select Current Project:",
      selectProjOption: "-- Click to select --",
      proj1: "Factory Towers Project",
      proj2: "New Production Line Project",
      proj3: "General Maintenance Project",
      startWorkBtn: "Check In & Enter System",
      tasksTab: "📋 Daily Tasks",
      requestsTab: "✍️ New Requests",
      trackingTab: "📊 Track Requests",
      logoutBtn: "Logout",
      dateLabel: "Date:",
      filterBtn: "Filter",
      tasksTitle: "Required Tasks",
      noTasks: "No tasks recorded for this date.",
      requestsTitle: "Submit New Request",
      loanBtn: "💰 Cash Advance",
      leaveBtn: "🌴 Leave Request",
      issueBtn: "⚠️ Report Issue / Bug",
      amountLabel: "Amount (SAR):",
      notesLabel: "Advance Details / Reason:",
      sendLoan: "Send Advance Request",
      leaveTypeLabel: "Leave Type:",
      annualLeave: "Annual Leave",
      casualLeave: "Casual Leave",
      sickLeave: "Sick Leave",
      leaveReasonLabel: "Reason & Details:",
      sendLeave: "Send Leave Request",
      issueDescLabel: "Issue Description:",
      sendIssue: "Send Report to Management",
      trackingTitle: "Requests Tracking",
      noRequests: "No requests sent on this date.",
      statusPending: "Pending Review",
      menuToggle: "☰ Menu"
    }
  }[lang];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Cairo, Tahoma, Arial, sans-serif', direction: lang === 'ar' ? 'rtl' : 'ltr', margin: 0, padding: 0, position: 'relative' }}>
      
      {/* زر الترجمة في أقصى اليسار العلوي */}
      <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 100 }}>
        <a 
          href={`/?code=${workerCode || ''}&project=${encodeURIComponent(currentProject || '')}&tab=${currentTab}&date=${selectedDate}&sub=${requestSubtype}&lang=${lang === 'ar' ? 'en' : 'ar'}`}
          style={{ backgroundColor: '#334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          {lang === 'ar' ? 'English 🌐' : 'عربي 🌐'}
        </a>
      </div>

      {!workerCode ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', borderTop: '6px solid #0284c7', textAlign: 'center' }}>
            <h1 style={{ color: '#1e293b', fontSize: '26px', margin: '0 0 10px 0' }}>{t.title}</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 25px 0' }}>{t.loginPrompt}</p>

            <form action={async (formData) => {
              'use server';
              const code = formData.get('code');
              if (code) {
                const { redirect } = await import('next/navigation');
                redirect(`/?code=${code}&lang=${lang}`);
              }
            }}>
              <input 
                type="number" 
                name="code" 
                placeholder={t.codePlaceholder} 
                required 
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '18px', textAlign: 'center', backgroundColor: '#f8fafc', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }} 
              />
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t.loginBtn}
              </button>
            </form>
          </div>
        </div>
      ) : !currentProject ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '450px', borderTop: '6px solid #16a34a' }}>
            <h2 style={{ color: '#1e293b', fontSize: '22px', margin: '0 0 8px 0', textAlign: 'center' }}>{t.welcome} {workerCode}</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 25px 0', textAlign: 'center' }}>{t.selectProj}</p>

            <form action={async (formData) => {
              'use server';
              const code = formData.get('code');
              const project = formData.get('project');
              const currentLang = formData.get('lang');
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
                redirect(`/?code=${code}&project=${encodeURIComponent(project)}&tab=tasks&lang=${currentLang}`);
              }
            }}>
              <input type="hidden" name="code" value={workerCode} />
              <input type="hidden" name="lang" value={lang} />
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{t.projLabel}</label>
                <select name="project" required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none' }}>
                  <option value="">{t.selectProjOption}</option>
                  <option value={t.proj1}>{t.proj1}</option>
                  <option value={t.proj2}>{t.proj2}</option>
                  <option value={t.proj3}>{t.proj3}</option>
                </select>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t.startWorkBtn}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div>
          <input type="checkbox" id="sidebar-toggle" style={{ display: 'none' }} />

          <style dangerouslySetInnerHTML={{__html: `
            .sidebar {
              position: fixed;
              top: 0;
              ${lang === 'ar' ? 'right' : 'left'}: -280px;
              width: 280px;
              height: 100vh;
              background-color: #1e293b;
              color: #fff;
              padding: 30px 20px;
              display: flex;
              flex-direction: column;
              box-shadow: 4px 0 10px rgba(0,0,0,0.1);
              transition: 0.3s ease-in-out;
              z-index: 1000;
            }
            #sidebar-toggle:checked ~ .sidebar {
              ${lang === 'ar' ? 'right' : 'left'}: 0;
            }
            .main-content {
              padding: 20px;
            }
            @media (min-width: 768px) {
              .sidebar {
                position: static;
                ${lang === 'ar' ? 'right' : 'left'}: auto;
                height: 100vh;
                box-shadow: none;
              }
              .menu-btn {
                display: none !important;
              }
              .main-content {
                flex: 1;
                padding: 40px;
              }
              .layout-container {
                display: flex;
                min-height: 100vh;
              }
            }
          `}} />

          <div className="layout-container">
            
            <div style={{ padding: '15px 20px', backgroundColor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="sidebar-toggle" className="menu-btn" style={{ background: '#0284c7', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                {t.menuToggle}
              </label>
              <span style={{ fontSize: '14px', color: '#38bdf8' }}>{t.welcome} {workerCode}</span>
            </div>

            <aside className="sidebar">
              <div style={{ marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#38bdf8' }}>{t.welcome} {workerCode}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Project: {currentProject}</span>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tasks&date=${selectedDate}&lang=${lang}`} style={{ padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tasks' ? '#0284c7' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {t.tasksTab}
                </a>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan&lang=${lang}`} style={{ padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'requests' ? '#0284c7' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {t.requestsTab}
                </a>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${selectedDate}&lang=${lang}`} style={{ padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tracking' ? '#0284c7' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {t.trackingTab}
                </a>
              </nav>

              <form action={async () => {
                'use server';
                const { redirect } = await import('next/navigation');
                redirect(`/?lang=${lang}`);
              }}>
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  {t.logoutBtn}
                </button>
              </form>
            </aside>

            <main className="main-content">
              
              <div style={{ backgroundColor: '#ffffff', padding: '15px 25px', borderRadius: '14px', marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>
                    {currentTab === 'tasks' && t.tasksTitle}
                    {currentTab === 'requests' && t.requestsTitle}
                    {currentTab === 'tracking' && t.trackingTitle}
                  </h2>
                </div>

                <form method="GET" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="hidden" name="code" value={workerCode} />
                  <input type="hidden" name="project" value={currentProject} />
                  <input type="hidden" name="tab" value={currentTab} />
                  <input type="hidden" name="sub" value={requestSubtype} />
                  <input type="hidden" name="lang" value={lang} />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>{t.dateLabel}</span>
                  <input 
                    type="date" 
                    name="date" 
                    defaultValue={selectedDate} 
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc' }}
                  />
                  <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                    {t.filterBtn}
                  </button>
                </form>
              </div>

              {currentTab === 'tasks' && (
                <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '12px', borderRight: lang === 'ar' ? '5px solid #0284c7' : 'none', borderLeft: lang === 'en' ? '5px solid #0284c7' : 'none', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '15px' }}>توريد وتركيب الواجهات الألومنيوم</h4>
                        <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>{lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>القطاع الشمالي - الدور الثاني</p>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'requests' && (
                <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan&lang=${lang}`} style={{ padding: '12px', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', backgroundColor: requestSubtype === 'loan' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'loan' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>
                      {t.loanBtn}
                    </a>
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=leave&lang=${lang}`} style={{ padding: '12px', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', backgroundColor: requestSubtype === 'leave' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'leave' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>
                      {t.leaveBtn}
                    </a>
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=issue&lang=${lang}`} style={{ padding: '12px', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', backgroundColor: requestSubtype === 'issue' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'issue' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>
                      {t.issueBtn}
                    </a>
                  </div>

                  {requestSubtype === 'loan' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const amount = formData.get('amount');
                      const notes = formData.get('notes');
                      const reqDate = formData.get('reqDate');
                      const proj = formData.get('proj');
                      const currentLang = formData.get('lang');

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
                      redirect(`/?code=${code}&project=${encodeURIComponent(proj)}&tab=tracking&date=${reqDate}&lang=${currentLang}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="proj" value={currentProject} />
                      <input type="hidden" name="reqDate" value={selectedDate} />
                      <input type="hidden" name="lang" value={lang} />

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '13px' }}>{t.amountLabel}</label>
                        <input type="number" name="amount" placeholder="500" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '13px' }}>{t.notesLabel}</label>
                        <textarea name="notes" placeholder="..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '70px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>{t.sendLoan}</button>
                    </form>
                  )}

                  {requestSubtype === 'leave' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const leaveType = formData.get('leaveType');
                      const reason = formData.get('reason');
                      const reqDate = formData.get('reqDate');
                      const proj = formData.get('proj');
                      const currentLang = formData.get('lang');

                      await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'طلب إجازة', ${'نوع الإجازة: ' + leaveType + ' - السبب: ' + reason}, ${reqDate})`;
                      
                      const { redirect } = await import('next/navigation');
                      redirect(`/?code=${code}&project=${encodeURIComponent(proj)}&tab=tracking&date=${reqDate}&lang=${currentLang}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="proj" value={currentProject} />
                      <input type="hidden" name="reqDate" value={selectedDate} />
                      <input type="hidden" name="lang" value={lang} />

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '13px' }}>{t.leaveTypeLabel}</label>
                        <select name="leaveType" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                          <option value={t.annualLeave}>{t.annualLeave}</option>
                          <option value={t.casualLeave}>{t.casualLeave}</option>
                          <option value={t.sickLeave}>{t.sickLeave}</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '13px' }}>{t.leaveReasonLabel}</label>
                        <textarea name="reason" placeholder="..." required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '70px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>{t.sendLeave}</button>
                    </form>
                  )}

                  {requestSubtype === 'issue' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const desc = formData.get('desc');
                      const reqDate = formData.get('reqDate');
                      const proj = formData.get('proj');
                      const currentLang = formData.get('lang');

                      await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'إبلاغ عن مشكلة', ${desc}, ${reqDate})`;
                      
                      const { redirect } = await import('next/navigation');
                      redirect(`/?code=${code}&project=${encodeURIComponent(proj)}&tab=tracking&date=${reqDate}&lang=${currentLang}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="proj" value={currentProject} />
                      <input type="hidden" name="reqDate" value={selectedDate} />
                      <input type="hidden" name="lang" value={lang} />

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '13px' }}>{t.issueDescLabel}</label>
                        <textarea name="desc" placeholder="..." required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '90px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>{t.sendIssue}</button>
                    </form>
                  )}

                </div>
              )}

              {currentTab === 'tracking' && (
                <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '16px' }}>{t.trackingTitle} ({selectedDate})</h3>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <strong style={{ color: '#1e293b', display: 'block', marginBottom: '4px', fontSize: '14px' }}>سلفة مالية</strong>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>المبلغ: 500 ريال</span>
                      </div>
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{t.statusPending}</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>{t.noRequests}</p>
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
