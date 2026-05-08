
const API_URL = "http://127.0.0.1:8080/api";

document.addEventListener("DOMContentLoaded", () => {

    const insertBtn = document.querySelector('.insert-card-btn');
    if (insertBtn) {
        insertBtn.addEventListener('click', () => { window.location.href = "userid.html"; });
    }

    const adminBtn = document.getElementById('admin-entrance-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => { window.location.href = "admin-login.html"; });
    }

    const adminLoginMain = document.querySelector('.admin-main');

    if (adminLoginMain && !document.querySelector('.dash-content')) {
        const pinDots = adminLoginMain.querySelectorAll('.pin-dot');
        const adminKeys = adminLoginMain.querySelectorAll('.n-btn');
        let adminPin = "";
        
        const CORRECT_ADMIN_PIN = "9999"; 

        if (pinDots.length > 0 && adminKeys.length > 0) {
            adminKeys.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.classList.contains('del')) {
                        adminPin = adminPin.slice(0, -1);
                    } else if (btn.classList.contains('confirm')) {
                        if (adminPin.length !== 4) return alert("الرمز السري للإدارة 4 أرقام");
                        
                        if (adminPin === CORRECT_ADMIN_PIN) {
                            window.location.href = "admin.html"; 
                        } else {
                            alert("عفواً، الرقم السري للإدارة غير صحيح!");
                            adminPin = ""; 
                        }
                    } else {
                        if (adminPin.length < 4) adminPin += btn.innerText.trim();
                    }

                    pinDots.forEach((dot, i) => {
                        if (i < adminPin.length) dot.classList.add('active');
                        else dot.classList.remove('active');
                    });
                });
            });
        }
    }

    const userIdMain = document.querySelector('.userid-main');
    if (userIdMain) {
        const display = userIdMain.querySelector('.input-val');
        let currentId = "";
        userIdMain.querySelectorAll('.n-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('del')) currentId = currentId.slice(0, -1);
                else if (btn.classList.contains('confirm')) {
                    if (currentId === "") return alert("برجاء إدخال رقم الحساب");
                    localStorage.setItem("session_userid", currentId);
                    window.location.href = "pin.html";
                } else { if (currentId.length < 10) currentId += btn.innerText.trim(); }
                display.innerText = currentId === "" ? "_ _ _ _" : currentId;
            });
        });
    }

    const isClientPin = !document.querySelector('.admin-main');
    const clientPinDots = document.querySelectorAll('.pin-dot');
    const clientPinButtons = document.querySelectorAll('.key-btn');
    
    if (isClientPin && clientPinDots.length > 0 && clientPinButtons.length > 0) {
        let currentPin = "";
        const userId = localStorage.getItem("session_userid");
        clientPinButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                if (btn.classList.contains('clear')) currentPin = "";
                else if (btn.classList.contains('confirm')) {
                    if (currentPin.length !== 4) return alert("الرقم السري 4 أرقام");
                    try {
                        const response = await fetch(`${API_URL}/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: userId, pin: currentPin })
                        });
                        const data = await response.json();
                        if (data.status === "success") window.location.href = "menu.html";
                        else { alert("عفواً، الرقم السري خطأ"); currentPin = ""; }
                    } catch (err) { alert("السيرفر مش شغال! تأكد من تشغيل server.exe"); }
                } else { if (currentPin.length < 4) currentPin += btn.innerText.trim(); }
                
                clientPinDots.forEach((dot, i) => {
                    if (i < currentPin.length) dot.classList.add('active');
                    else dot.classList.remove('active');
                });
            });
        });
    }

    const menuButtons = document.querySelectorAll('.menu-btn');
    if (menuButtons.length > 0) {
        menuButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const actionText = btn.querySelector('.btn-text').innerText.trim();
                if (actionText === "سحب نقدي") window.location.href = "withdraw.html";
                else if (actionText === "استعلام عن الرصيد") window.location.href = "balance.html";
                else if (actionText === "إيداع نقدي") window.location.href = "deposit.html";
                else if (actionText === "تغيير الرمز السري") window.location.href = "change-pin.html";
                else alert("الخدمة: " + actionText + " ستكون متاحة قريباً");
            });
        });
    }

    const withdrawButtons = document.querySelectorAll('.amount-btn');
    if (withdrawButtons.length > 0) {
        const userId = localStorage.getItem("session_userid");
        withdrawButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                if (btn.classList.contains('other-amount')) {
                    window.location.href = "withdraw-other.html";
                    return;
                }
                let amountText = btn.innerText.replace(/[^0-9]/g, '');
                let amount = parseInt(amountText);
                if (isNaN(amount) || amount === 0) return;
                try {
                    const response = await fetch(`${API_URL}/withdraw`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: userId, amount: amount })
                    });
                    const data = await response.json();
                    if (data.status === "success") {
                        window.location.href = "success.html";
                    } else {
                        localStorage.setItem("error_message", data.message);
                        window.location.href = "error.html";
                    }
                } catch (err) { alert("خطأ في الاتصال بالسيرفر"); }
            });
        });
    }

    const depositMain = document.querySelector('.deposit-main');
    if (depositMain) {
        const userId = localStorage.getItem("session_userid");
        const depositDisplay = depositMain.querySelector('.input-val');
        let depositAmount = "";
        
        depositMain.querySelectorAll('.n-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (btn.classList.contains('del')) {
                    depositAmount = depositAmount.slice(0, -1);
                } else if (btn.classList.contains('confirm')) {
                    if (depositAmount === "" || depositAmount === "0") return alert("برجاء إدخال المبلغ");
                    try {
                        const response = await fetch(`${API_URL}/deposit`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: userId, amount: parseInt(depositAmount) })
                        });
                        
                        if (response.status === 404) return alert("مسار الإيداع مش موجود في السيرفر!");

                        const data = await response.json();
                        if (data.status === "success") {
                            alert("تم الإيداع بنجاح!");
                            window.location.href = "menu.html";
                        } else alert(data.message);
                    } catch (err) { alert("خطأ في الاتصال بالسيرفر: " + err.message); }
                } else {
                    if (depositAmount.length < 6) depositAmount += btn.innerText.trim();
                }
                if (depositDisplay) depositDisplay.innerText = depositAmount === "" ? "0.00" : depositAmount;
            });
        });
    }

    const balanceContent = document.querySelector('.balance-content');
    if (balanceContent) {
        const userId = localStorage.getItem("session_userid");
        const amountDisplay = balanceContent.querySelector('.amount');
        const returnBtn = balanceContent.querySelector('.outline-btn');
        const printBtn = balanceContent.querySelector('.gold-btn');

        if (amountDisplay && userId) {
            amountDisplay.innerText = "جاري التحميل..."; 
            (async () => {
                try {
                    const response = await fetch(`${API_URL}/balance`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: userId })
                    });
                    const data = await response.json();
                    if (data.status === "success") {
                        amountDisplay.innerText = Number(data.balance).toLocaleString('en-US', {minimumFractionDigits: 2});
                    } else {
                        amountDisplay.innerText = "خطأ";
                    }
                } catch (err) {
                    amountDisplay.innerText = "خطأ اتصال";
                }
            })();
        }

        if (returnBtn) returnBtn.addEventListener('click', () => { window.location.href = "menu.html"; });
        if (printBtn) printBtn.addEventListener('click', () => { alert("جاري طباعة الإيصال... برجاء الانتظار."); });
    }

    const adminDashboard = document.querySelector('.dash-content');
    if (adminDashboard) {
        const addBtn = document.querySelector('.submit-btn.green');
        const deleteBtn = document.querySelector('.submit-btn.red');
        const logoutBtn = document.querySelector('.logout-btn');

        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                const inputs = document.querySelectorAll('.admin-panel:first-child .admin-input');
                const id = inputs[0].value;
                const pin = inputs[1].value;
                const balance = inputs[2].value;
                const type = inputs[3].value;

                if (!id || !pin || !balance) return alert("برجاء ملء كافة البيانات");

                try {
                    const response = await fetch(`${API_URL}/admin/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            id: id, 
                            pin: pin, 
                            balance: parseFloat(balance), 
                            type: parseInt(type) 
                        })
                    });
                    const data = await response.json();
                    if (data.status === "success") {
                        alert("تم إنشاء الحساب رقم " + id + " بنجاح");
                        inputs.forEach(input => input.value = ""); 
                    }
                } catch (err) { alert("خطأ في الاتصال بالسيرفر"); }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const deleteInput = document.querySelector('.admin-panel:last-child .admin-input');
                const id = deleteInput.value;

                if (!id) return alert("برجاء إدخال رقم الحساب المراد حذفه");

                if (confirm("هل أنت متأكد من حذف الحساب رقم " + id + "؟")) {
                    try {
                        const response = await fetch(`${API_URL}/admin/delete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: id })
                        });
                        const data = await response.json();
                        if (data.status === "success") {
                            alert("تم حذف الحساب بنجاح");
                            deleteInput.value = "";
                        } else { alert(data.message); }
                    } catch (err) { alert("خطأ في الاتصال بالسيرفر"); }
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.location.href = "index.html";
            });
        }
    }

    const allCancelBtns = document.querySelectorAll('.cancel-btn, .cancel-footer-btn, .exit-btn, .logout-btn');
    allCancelBtns.forEach(btn => {

        if(!btn.closest('.dash-header')) {
            btn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = "index.html";
            });
        }
    });

    const addAccBtn = document.getElementById('add-acc-btn');
    const delAccBtn = document.getElementById('del-acc-btn');
    const adminLogout = document.getElementById('admin-logout');

    // أ. منطق إضافة حساب جديد
    if (addAccBtn) {
        addAccBtn.addEventListener('click', async () => {
            const id = document.getElementById('new-acc-id').value;
            const pin = document.getElementById('new-acc-pin').value;
            const bal = document.getElementById('new-acc-balance').value;
            const type = document.getElementById('new-acc-type').value;

            if (!id || !pin || !bal) return alert("برجاء إدخال كافة البيانات (رقم الحساب، السر، الرصيد)");

            try {
                const response = await fetch(`${API_URL}/admin/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id: id, 
                        pin: pin, 
                        balance: parseFloat(bal), 
                        type: parseInt(type) 
                    })
                });
                const data = await response.json();
                if (data.status === "success") {
                    alert("عاش يا أبو حميد! الحساب رقم (" + id + ") انضاف بنجاح.");
                    document.getElementById('new-acc-id').value = "";
                    document.getElementById('new-acc-pin').value = "";
                    document.getElementById('new-acc-balance').value = "";
                } else {
                    alert(data.message);
                }
            } catch (err) {
                alert("السيرفر مش واصل! اتأكد إن الـ C++ شغال.");
            }
        });
    }

    if (delAccBtn) {
        delAccBtn.addEventListener('click', async () => {
            const id = document.getElementById('del-acc-id').value;
            if (!id) return alert("اكتب رقم الحساب اللي عايز تحذفه الأول");

            if (confirm("أنت متأكد إنك عايز تحذف الحساب ده نهائياً؟")) {
                try {
                    const response = await fetch(`${API_URL}/admin/delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id })
                    });
                    const data = await response.json();
                    if (data.status === "success") {
                        alert("تم حذف الحساب بنجاح.");
                        document.getElementById('del-acc-id').value = "";
                    } else {
                        alert(data.message);
                    }
                } catch (err) {
                    alert("خطأ في الاتصال بالسيرفر");
                }
            }
        });
    }

    if (adminLogout) {
        adminLogout.addEventListener('click', () => {
            window.location.href = "index.html";
        });
    }

    const withdrawOtherMain = document.querySelector('.withdraw-other-main');
    if (withdrawOtherMain) {
        const userId = localStorage.getItem("session_userid");
        const withdrawDisplay = withdrawOtherMain.querySelector('.input-val');
        let customWithdrawAmount = "";
        
        withdrawOtherMain.querySelectorAll('.n-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (btn.classList.contains('del')) {
                    customWithdrawAmount = customWithdrawAmount.slice(0, -1);
                } else if (btn.classList.contains('confirm')) {
                    if (customWithdrawAmount === "" || customWithdrawAmount === "0") return alert("برجاء إدخال المبلغ");
                    
                    let finalAmount = parseInt(customWithdrawAmount);
                    
                    try {
                        const response = await fetch(`${API_URL}/withdraw`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: userId, amount: finalAmount })
                        });
                        const data = await response.json();
                        if (data.status === "success") {
                            window.location.href = "success.html";
                        } else {

                            localStorage.setItem("error_message", data.message);
                            window.location.href = "error.html";
                        }
                    } catch (err) { alert("خطأ في الاتصال بالسيرفر"); }
                } else {
                    if (customWithdrawAmount.length < 5) customWithdrawAmount += btn.innerText.trim();
                }
                if (withdrawDisplay) withdrawDisplay.innerText = customWithdrawAmount === "" ? "0" : customWithdrawAmount;
            });
        });
    }

    const errorContent = document.querySelector('.error-content');
    if (errorContent) {
        const errorMsgText = document.getElementById('dynamic-error');
        const backBtn = errorContent.querySelector('.back-btn');

        const savedError = localStorage.getItem("error_message");
        if (savedError && errorMsgText) {
            errorMsgText.innerText = savedError;
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                localStorage.removeItem("error_message"); // تنظيف
                window.location.href = "menu.html";
            });
        }
    }
});