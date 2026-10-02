import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export default async function WorkerDashboard({ searchParams }) {
  const params = await searchParams;
  const workerCode = params?.code;
  const currentProject = params?.project;
  const currentTab = params?.tab || 'tasks';
  const selectedDate = params?.date || new Date().toISOString().split('T')[0];
  const requestSubtype = params?.sub || 'loan';
  const lang = params?.lang || 'ar'; // نظام الترجمة

  // قاموس الترجمة للواجهة
  const t = {
    ar: {
      title: "نظام إدارة المصنع",
      loginPrompt: "أدخل كود العامل للمتابعة",
      codePlaceholder: "أدخل الكود (مثال: 1100)",
      loginBtn: "تسجيل الدخول",
      welcome: "مرحباً، كود:",
      selectProj: "الرجاء اختيار المشروع لتسجيل الحضور",
      projLabel: "اختر المشروع الحالي:",
      selectProjOption: "-- اضغط للاختيار --",
      proj1: "مشروع أبراج المصنع",
      proj2: "مشروع خط الإنتاج الجديد",
      proj3: "مشروع الصيانة العامة",
      startWorkBtn: "تسجيل حضور ودخول النظام",
      tasksTab: "📋 المهام اليومية",
      requestsTab: "✍️ تقديم طلب جديد",
      trackingTab: "📊 متابعة الطلبات",
      logoutBtn: "تسجيل خروج",
      dateLabel: "تاريخ العرض:",
      filterBtn: "فلترة",
      tasksTitle: "المهام المطلوبة",
      noTasks: "لا توجد مهام مسجلة لهذا التاريخ.",
      requestsTitle: "نافذة تقديم الطلبات",
      loanBtn: "💰 طلب سلفة",
      leaveBtn: "🌴 طلب إجازة",
      issueBtn: "⚠ إبلاغ عن مشكلة",
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
      title: "Factory System",
      loginPrompt: "Enter worker code to continue",
      codePlaceholder: "Code (e.g. 1100)",
      loginBtn: "Login",
      welcome: "Welcome, Code:",
      selectProj: "Please select a project to check in",
      projLabel: "Select Current Project:",
      selectProjOption: "-- Click to select --",
      proj1: "Towers Project",
      proj2: "New Production Line",
      proj3: "General Maintenance",
      startWorkBtn: "Check In",
      tasksTab: "📋 Daily Tasks",
      requestsTab: "✍️ New Request",
      trackingTab: "📊 Track Requests",
      logoutBtn: "Logout",
      dateLabel: "Date:",
      filterBtn: "Filter",
      tasksTitle: "Required Tasks",
      noTasks: "No tasks for this date.",
      requestsTitle: "Submit Request",
      loanBtn: "💰 Cash Advance",
      leaveBtn: "🌴 Leave Request",
      issueBtn: "⚠️ Report Issue",
      amountLabel: "Amount (SAR):",
      notesLabel: "Advance Details / Reason:",
      sendLoan: "Send Request",
      leaveTypeLabel: "Leave Type:",
      annualLeave: "Annual Leave",
      casualLeave: "Casual Leave",
      sickLeave: "Sick Leave",
      leaveReasonLabel: "Reason & Details:",
      sendLeave: "Send Request",
      issueDescLabel: "Issue Description:",
      sendIssue: "Send Report",
      trackingTitle: "Requests Tracking",
      noRequests: "No requests found for this date.",
      statusPending: "Pending",
      menuToggle: "☰ Menu"
    }
  }[lang];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', direction: lang === 'ar' ? 'rtl' : 'ltr', margin: 0, padding: 0 }}>
      
      {/* زر الترجمة تم تعديل مكانه لتجنب التداخل */}
      <div style={{ position: 'absolute', top: '15px', [lang === 'ar' ? 'left' : 'right']: '15px', zIndex: 1000 }}>
        <a 
          href={`/?code=${workerCode || ''}&project=${encodeURIComponent(currentProject || '')}&tab=${currentTab}&date=${selectedDate}&sub=${requestSubtype}&lang=${lang === 'ar' ? 'en' : 'ar'}`}
          style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px 15px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
        >
          {lang === 'ar' ? 'English 🌐' : 'عربي 🌐'}
        </a>
      </div>

      {/* ستايل الموبايل التفاعلي المصلح بالكامل */}
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; }
        
        .sidebar {
          position: fixed;
          top: 0;
          ${lang === 'ar' ? 'right' : 'left'}: -320px;
          width: 280px;
          height: 100vh;
          background-color: #1e293b;
          color: #fff;
          padding: 20px;
          display: flex;
          flex-direction: column;
          transition: 0.3s ease-in-out;
          z-index: 1001;
          overflow-y: auto;
        }
        
        /* تفعيل ظهور القائمة */
        #menu-toggle:checked ~ .layout-container .sidebar {
          ${lang === 'ar' ? 'right' : 'left'}: 0;
        }
        
        /* خلفية معتمة عند فتح القائمة */
        .overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          z-index: 1000;
        }
        #menu-toggle:checked ~ .layout-container .overlay { display: block; }

        .main-content { width: 100%; padding: 15px; }

        .mobile-header {
          display: flex;
          align-items: center;
          gap: 15px;
          background: #ffffff;
          padding: 15px;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-top: 50px; /* مسافة لزر الترجمة */
        }

        .req-buttons-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        /* تنسيقات الشاشات الكبيرة */
        @media (min-width: 768px) {
          .layout-container { display: flex; min-height: 100vh; }
          .sidebar { position: static; ${lang === 'ar' ? 'right' : 'left'}: 0; box-shadow: 4px 0 10px rgba(0,0,0,0.05); }
          .overlay { display: none !important; }
          .main-content { flex: 1; padding: 40px; }
          .mobile-header { display: none; }
          .close-btn { display: none; }
          .req-buttons-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}} />

      {/* مرحلة 1: تسجيل الدخول */}
      {!workerCode ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', marginTop: '40px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', borderTop: '5px solid #0284c7', textAlign: 'center' }}>
            <h1 style={{ color: '#1e293b', fontSize: '24px', margin: '0 0 10px 0' }}>{t.title}</h1>
            <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 25px 0' }}>{t.loginPrompt}</p>

            <form action={async (formData) => {
              'use server';
              const code = formData.get('code');
              const currentLang = formData.get('lang');
              if (code) {
                const { redirect } = await import('next/navigation');
                redirect(`/?code=${code}&lang=${currentLang}`);
              }
            }}>
              <input type="hidden" name="lang" value={lang} />
              <input type="number" name="code" placeholder={t.codePlaceholder} required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '18px', textAlign: 'center', backgroundColor: '#f8fafc', outline: 'none', marginBottom: '20px' }} />
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t.loginBtn}
              </button>
            </form>
          </div>
        </div>
      ) : !currentProject ? (
        /* مرحلة 2: اختيار المشروع */
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', marginTop: '40px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px', borderTop: '5px solid #16a34a' }}>
            <h2 style={{ color: '#1e293b', fontSize: '20px', margin: '0 0 8px 0', textAlign: 'center' }}>{t.welcome} {workerCode}</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 25px 0', textAlign: 'center' }}>{t.selectProj}</p>

            <form action={async (formData) => {
              'use server';
              const code = formData.get('code');
              const project = formData.get('project');
              const currentLang = formData.get('lang');
              if (code && project) {
                await sql`CREATE TABLE IF NOT EXISTS worker_sessions (id SERIAL PRIMARY KEY, worker_code VARCHAR(50), project_name VARCHAR(100), login_date DATE DEFAULT CURRENT_DATE);`;
                await sql`INSERT INTO worker_sessions (worker_code, project_name) VALUES (${code}, ${project})`;
                const { redirect } = await import('next/navigation');
                redirect(`/?code=${code}&project=${encodeURIComponent(project)}&tab=tasks&lang=${currentLang}`);
              }
            }}>
              <input type="hidden" name="code" value={workerCode} />
              <input type="hidden" name="lang" value={lang} />
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{t.projLabel}</label>
                <select name="project" required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none' }}>
                  <option value="">{t.selectProjOption}</option>
                  <option value={t.proj1}>{t.proj1}</option>
                  <option value={t.proj2}>{t.proj2}</option>
                  <option value={t.proj3}>{t.proj3}</option>
                </select>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t.startWorkBtn}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* مرحلة 3: اللوحة الرئيسية */
        <div>
          <input type="checkbox" id="menu-toggle" style={{ display: 'none' }} />

          <div className="layout-container">
            <label htmlFor="menu-toggle" className="overlay"></label>
            
            {/* الهيدر الخاص بالموبايل */}
            <div className="mobile-header">
              <label htmlFor="menu-toggle" style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
                {t.menuToggle}
              </label>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>{t.welcome} {workerCode}</span>
            </div>

            {/* القائمة الجانبية */}
            <aside className="sidebar">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#38bdf8' }}>{t.welcome} {workerCode}</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{currentProject}</span>
                </div>
                {/* زر الإغلاق */}
                <label htmlFor="menu-toggle" className="close-btn" style={{ fontSize: '24px' }}>✖</label>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tasks&date=${selectedDate}&lang=${lang}`} onClick={() => document.getElementById('menu-toggle').checked = false} style={{ padding: '14px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tasks' ? '#0284c7' : 'transparent', color: '#fff' }}>
                  {t.tasksTab}
                </a>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan&lang=${lang}`} onClick={() => document.getElementById('menu-toggle').checked = false} style={{ padding: '14px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'requests' ? '#0284c7' : 'transparent', color: '#fff' }}>
                  {t.requestsTab}
                </a>
                <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${selectedDate}&lang=${lang}`} onClick={() => document.getElementById('menu-toggle').checked = false} style={{ padding: '14px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', backgroundColor: currentTab === 'tracking' ? '#0284c7' : 'transparent', color: '#fff' }}>
                  {t.trackingTab}
                </a>
              </nav>

              <form action={async () => {
                'use server';
                const { redirect } = await import('next/navigation');
                redirect(`/?lang=${lang}`);
              }}>
                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '20px' }}>
                  {t.logoutBtn}
                </button>
              </form>
            </aside>

            {/* المحتوى الرئيسي */}
            <main className="main-content">
              
              {/* شريط الفلتر */}
              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px', width: '100%', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  {currentTab === 'tasks' && t.tasksTitle}
                  {currentTab === 'requests' && t.requestsTitle}
                  {currentTab === 'tracking' && t.trackingTitle}
                </h2>

                <form method="GET" style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                  <input type="hidden" name="code" value={workerCode} />
                  <input type="hidden" name="project" value={currentProject} />
                  <input type="hidden" name="tab" value={currentTab} />
                  <input type="hidden" name="sub" value={requestSubtype} />
                  <input type="hidden" name="lang" value={lang} />
                  <input 
                    type="date" 
                    name="date" 
                    defaultValue={selectedDate} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                  <button type="submit" style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                    {t.filterBtn}
                  </button>
                </form>
              </div>

              {/* التابة 1: المهام */}
              {currentTab === 'tasks' && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>{t.dateLabel} <strong>{selectedDate}</strong></p>
                  
                  <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', borderRight: lang === 'ar' ? '4px solid #0284c7' : 'none', borderLeft: lang === 'en' ? '4px solid #0284c7' : 'none', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '15px' }}>{lang === 'ar' ? 'توريد وتركيب الواجهات الألومنيوم' : 'Supply and Install Aluminum Facades'}</h4>
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{lang === 'ar' ? 'القطاع الشمالي - الدور الثاني' : 'North Sector - Second Floor'}</p>
                  </div>
                </div>
              )}

              {/* التابة 2: تقديم الطلبات */}
              {currentTab === 'requests' && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  
                  <div className="req-buttons-grid">
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=loan&lang=${lang}`} style={{ padding: '12px', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', backgroundColor: requestSubtype === 'loan' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'loan' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>{t.loanBtn}</a>
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=leave&lang=${lang}`} style={{ padding: '12px', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', backgroundColor: requestSubtype === 'leave' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'leave' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>{t.leaveBtn}</a>
                    <a href={`/?code=${workerCode}&project=${encodeURIComponent(currentProject)}&tab=requests&date=${selectedDate}&sub=issue&lang=${lang}`} style={{ padding: '12px', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', backgroundColor: requestSubtype === 'issue' ? '#0284c7' : '#f1f5f9', color: requestSubtype === 'issue' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}>{t.issueBtn}</a>
                  </div>

                  {requestSubtype === 'loan' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const amount = formData.get('amount');
                      const notes = formData.get('notes');
                      const reqDate = formData.get('reqDate');
                      const currentLang = formData.get('lang');
                      await sql`CREATE TABLE IF NOT EXISTS requests (id SERIAL PRIMARY KEY, worker_code VARCHAR(50), req_type VARCHAR(50), details TEXT, status VARCHAR(50) DEFAULT 'قيد المراجعة', request_date DATE);`;
                      await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'سلفة مالية', ${'المبلغ: ' + amount + ' - ملاحظات: ' + notes}, ${reqDate})`;
                      const { redirect } = await import('next/navigation');
                      redirect(`/?code=${code}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${reqDate}&lang=${currentLang}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="reqDate" value={selectedDate} />
                      <input type="hidden" name="lang" value={lang} />
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{t.amountLabel}</label>
                        <input type="number" name="amount" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{t.notesLabel}</label>
                        <textarea name="notes" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '80px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>{t.sendLoan}</button>
                    </form>
                  )}

                  {/* باقي نماذج الطلبات (إجازة / مشكلة) بنفس التنسيق */}
                  {/* ... (لتقليل حجم الكود، نفس التنسيق السابق معتمد) ... */}
                   {requestSubtype === 'leave' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const leaveType = formData.get('leaveType');
                      const reason = formData.get('reason');
                      const reqDate = formData.get('reqDate');
                      const currentLang = formData.get('lang');
                      await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'طلب إجازة', ${'النوع: ' + leaveType + ' - السبب: ' + reason}, ${reqDate})`;
                      const { redirect } = await import('next/navigation');
                      redirect(`/?code=${code}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${reqDate}&lang=${currentLang}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="reqDate" value={selectedDate} />
                      <input type="hidden" name="lang" value={lang} />
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{t.leaveTypeLabel}</label>
                        <select name="leaveType" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                          <option value={t.annualLeave}>{t.annualLeave}</option>
                          <option value={t.casualLeave}>{t.casualLeave}</option>
                          <option value={t.sickLeave}>{t.sickLeave}</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{t.leaveReasonLabel}</label>
                        <textarea name="reason" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '80px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>{t.sendLeave}</button>
                    </form>
                  )}

                  {requestSubtype === 'issue' && (
                    <form action={async (formData) => {
                      'use server';
                      const code = formData.get('workerCode');
                      const desc = formData.get('desc');
                      const reqDate = formData.get('reqDate');
                      const currentLang = formData.get('lang');
                      await sql`INSERT INTO requests (worker_code, req_type, details, request_date) VALUES (${code}, 'إبلاغ عن مشكلة', ${desc}, ${reqDate})`;
                      const { redirect } = await import('next/navigation');
                      redirect(`/?code=${code}&project=${encodeURIComponent(currentProject)}&tab=tracking&date=${reqDate}&lang=${currentLang}`);
                    }}>
                      <input type="hidden" name="workerCode" value={workerCode} />
                      <input type="hidden" name="reqDate" value={selectedDate} />
                      <input type="hidden" name="lang" value={lang} />
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{t.issueDescLabel}</label>
                        <textarea name="desc" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '100px', outline: 'none' }}></textarea>
                      </div>
                      <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>{t.sendIssue}</button>
                    </form>
                  )}
                </div>
              )}

              {/* التابة 3: المتابعة */}
              {currentTab === 'tracking' && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '16px' }}>{t.trackingTitle} ({selectedDate})</h3>

                  <div style={{ marginTop: '15px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#1e293b', display: 'block', marginBottom: '4px', fontSize: '14px' }}>{lang === 'ar' ? 'سلفة مالية' : 'Cash Advance'}</strong>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>{lang === 'ar' ? 'المبلغ: 500 ريال' : 'Amount: 500 SAR'}</span>
                      </div>
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{t.statusPending}</span>
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
