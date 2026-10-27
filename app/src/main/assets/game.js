(function() {

    // 🟢 KONFIGURASI SUPABASE (ANTI CRASH & FIX ERROR)
    const SUPABASE_URL = "https://hfdmjqorcctsajyrpdcd.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZG1qcW9yY2N0c2FqeXJwZGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTIyMjksImV4cCI6MjA5NjU4ODIyOX0.8CAuxepHZNk148uI6emGDAnAgDlvfOts5qn5m9kIn4A";
    const SUPABASE_API_URL = `${SUPABASE_URL}/rest/v1/cybertap_leaderboard`;
    const SUPABASE_CHAT_URL = `${SUPABASE_URL}/rest/v1/cybertap_chats`;

    // --- 1. State Game Bawaan Lu ---
    let gameState = {
        accountId: "", 
        playerName: "Hozinking",
        playerLikes: 0,
        friendsList: [],      
        visitorHistory: [],   

        score: 0,
        clickPower: 1,
        autoTappers: 0,
        clickUpgradeCost: 25,
        clickLevel: 1,
        autoUpgradeCost: 50,
        autoLevel: 0,
        lastSavedTime: 0,
        totalClicks: 0,
        totalEnergyFromClicks: 0,
        totalEnergyFromSeconds: 0,
        totalEnergySpent: 0,
        totalEnergyAllTime: 0,
        
        quantumUpgradeCost: 500,
        quantumLevel: 0,
        antimatterUpgradeCost: 5000,
        antimatterLevel: 0,
        dysonUpgradeCost: 75000,
        dysonLevel: 0,

        // 🆕 5 ITEM BARU
        novaUpgradeCost: 500000,
        novaLevel: 0,
        singularityUpgradeCost: 5000000,
        singularityLevel: 0,
        infinityUpgradeCost: 50000000,
        infinityLevel: 0,
        omegaUpgradeCost: 500000000,
        omegaLevel: 0,
        godUpgradeCost: 5000000000,
        godLevel: 0,

        autoClickCost: 1500,
        autoClickLevel: 0,
        autoUpgradeTarget: "none",
        
        autoUpgradeTimer: 18000,     
        maxBatteryCapacity: 18000,   
        batteryUpgradeCost: 1000,    

        isMusicSavedOn: false,
        securityLogs: [],
        
        // Supabase Token
        supabaseUserToken: null,
        supabaseUserEmail: null
    };

    let JARINGAN_PLAYER_CACHE = {};
    let currentInspectTargetId = null;

    // AUDIO KERNEL
    let audioCtx = null; let musicInterval = null; let isMusicPlaying = false;
    function initAudioEngine() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } }
    
    function playTapSFX() {
        if (!audioCtx) return;
        try {
            let osc = audioCtx.createOscillator(); let gainNode = audioCtx.createGain();
            osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.type = "sine";
            osc.frequency.setValueAtTime(850, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        } catch(e){}
    }

    function playCyberBacksound() {
        if (!audioCtx || musicInterval) return;
        const barisNadaBass = [110, 110, 130, 110, 146, 146, 130, 164]; let hitunganBeat = 0;
        musicInterval = setInterval(() => {
            try {
                let osc = audioCtx.createOscillator(); let gainNode = audioCtx.createGain();
                if(gainNode) { gainNode.connect(audioCtx.destination); osc.connect(gainNode); osc.type = "sawtooth";
                    let nadaSkrg = barisNadaBass[hitunganBeat % barisNadaBass.length]; osc.frequency.setValueAtTime(nadaSkrg, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.25); hitunganBeat++;
                }
            } catch(err) {}
        }, 250);
    }
    function hentikanCyberBacksound() { if (musicInterval) { clearInterval(musicInterval); musicInterval = null; } }

    // ENKRIPSI LOCALSTORAGE
    const SECRET_KEY = "HozinkingThunderSakti99";
    function xorCipher(teks, kunci) { let hasil = ""; for (let i = 0; i < teks.length; i++) { hasil += String.fromCharCode(teks.charCodeAt(i) ^ kunci.charCodeAt(i % kunci.length)); } return hasil; }
    function enkripsiData(teksAwal) { return btoa(xorCipher(teksAwal, SECRET_KEY)); }
    function dekripsiData(teksEnkripsi) { return xorCipher(atob(teksEnkripsi), SECRET_KEY); }

    function formatAngka(angka) {
        if (angka < 1000) return Number(angka.toFixed(1)) % 1 === 0 ? Math.floor(angka).toString() : angka.toFixed(1);
        const notasiDasar = [{ value: 1e3, symbol: "K" }, { value: 1e6, symbol: "M" }, { value: 1e9, symbol: "B" }, { value: 1e12, symbol: "T" }, { value: 1e15, symbol: "Qa" }, { value: 1e18, symbol: "Qi" }, { value: 1e21, symbol: "Sx" }, { value: 1e24, symbol: "Sp" }];
        if (angka < 1e27) { for (let i = notasiDasar.length - 1; i >= 0; i--) { if (angka >= notasiDasar[i].value) { let hasilPecahan = (angka / notasiDasar[i].value).toFixed(2); if (hasilPecahan.endsWith('.00')) hasilPecahan = Math.floor(angka / notasiDasar[i].value); return hasilPecahan + notasiDasar[i].symbol; } } }
        let eksponen = Math.floor(Math.log10(angka) / 3) * 3; let indeksAbjad = Math.floor((eksponen - 27) / 3);
        function hitungSimbolAbjad(index) { let n = index; let simbol = ""; while (n >= 0) { simbol = String.fromCharCode((n % 26) + 97) + simbol; n = Math.floor(n / 26) - 1; } return simbol; }
        let hasilPecahanAbjad = (angka / Math.pow(10, eksponen)).toFixed(2); if (hasilPecahanAbjad.endsWith('.00')) hasilPecahanAbjad = Math.floor(angka / Math.pow(10, eksponen)); return hasilPecahanAbjad + hitungSimbolAbjad(indeksAbjad);
    }

    function formatWaktu(totalDetik) {
        if (totalDetik <= 0) return "00:00:00 (Mogok)";
        let jam = Math.floor(totalDetik / 3600); let menit = Math.floor((totalDetik % 3600) / 60); let detik = totalDetik % 60;
        return `${jam < 10 ? "0" + jam : jam}:${menit < 10 ? "0" + menit : menit}:${detik < 10 ? "0" + detik : detik}`;
    }

    function hitungHargaRefuelBaterai() { let sisaKosong = gameState.maxBatteryCapacity - gameState.autoUpgradeTimer; if(sisaKosong <= 0) return 0; let cost = Math.floor((sisaKosong / 3600) * 10); return cost < 10 ? 10 : cost; }

    function buatIDNumericUnik() { let barisAngka = ""; for(let i=0; i<8; i++) { let digitAcak = Math.floor(Math.random() * 10); if(i === 0 && digitAcak === 0) digitAcak = 1; barisAngka += digitAcak.toString(); } return barisAngka; }

    function tulisLogKeamanan(pesan, isAlert = false) {
        const waktuSekarang = new Date(); const strJam = waktuSekarang.toTimeString().split(' ')[0]; let identitasID = gameState.accountId || "SYSTEM";
        gameState.securityLogs.unshift({ time: strJam, text: `[UID: ${identitasID}] ${pesan}`, alert: isAlert });
        if (gameState.securityLogs.length > 25) gameState.securityLogs.pop();
    }

    // =========================================================================
    // 🌍 VERIFIKASI OPERASIONAL JARINGAN
    // =========================================================================
    function verifikasiStatusKoneksiJaringan() {
        const isOnline = navigator.onLine;
        const daftarTombolOnline = document.querySelectorAll('.online-only-btn');
        daftarTombolOnline.forEach(tombol => {
            if (!isOnline) {
                tombol.classList.add('disabled-offline');
                tombol.setAttribute('disabled', 'true');
            } else {
                tombol.classList.remove('disabled-offline');
                tombol.removeAttribute('disabled');
            }
        });
    }
    window.addEventListener('online', verifikasiStatusKoneksiJaringan);
    window.addEventListener('offline', verifikasiStatusKoneksiJaringan);

    // =========================================================================
    // 🔐 SUPABASE AUTH DENGAN SISTEM POP-UP OTP VERIFIKASI
    // =========================================================================
    async function prosesRegisterCloud() {
        if (!navigator.onLine || !SUPABASE_URL) return;
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        if (!email || !password) { alert("Isi email dan password lu!"); return; }

        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
                body: JSON.stringify({ email: email, password: password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error_description || data.message || "Gagal Daftar");
            
            document.getElementById('auth-form-credentials-layer').style.display = "none";
            document.getElementById('auth-form-otp-layer').style.display = "block";
            tulisLogKeamanan("Auth: Menunggu input kode OTP.");
            alert("Kode OTP berhasil dikirim! Periksa folder Inbox/Spam lu.");
        } catch (err) { alert("Gagal Daftar: " + err.message); }
    }

    async function prosesVerifikasiOTPCloud() {
        if (!navigator.onLine || !SUPABASE_URL) return;
        const email = document.getElementById('auth-email').value.trim();
        const tokenOtp = document.getElementById('auth-otp-code').value.trim();
        if (!tokenOtp) { alert("Ketik kode OTP!"); return; }

        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
                method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
                body: JSON.stringify({ type: "signup", email: email, token: tokenOtp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error_description || data.message || "OTP Kadaluarsa/Salah");

            gameState.supabaseUserToken = data.access_token;
            gameState.supabaseUserEmail = data.user.email;
            
            tulisLogKeamanan("Auth: Sesi terhubung via OTP.");
            alert("Verifikasi Berhasil! Akun cloud terhubung.");
            
            document.getElementById('auth-input-modal').classList.remove('active');
            await syncDataToCPanelServer(); perbaruiTampilanMenuAuthUI();
        } catch (err) { alert("Verifikasi Gagal: " + err.message); }
    }

    async function prosesLoginCloud() {
        if (!navigator.onLine || !SUPABASE_URL) return;
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
                body: JSON.stringify({ email: email, password: password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error_description || data.message || "Gagal Login");

            gameState.supabaseUserToken = data.access_token;
            gameState.supabaseUserEmail = data.user.email;
            
            tulisLogKeamanan("Auth: Sinkronisasi cloud berhasil.");
            alert("Login Sukses! Data cloud terhubung.");
            document.getElementById('auth-input-modal').classList.remove('active');
            await syncDataToCPanelServer(); perbaruiTampilanMenuAuthUI();
        } catch (err) { alert("Gagal Login: " + err.message); }
    }

    function prosesLogoutCloud() {
        gameState.supabaseUserToken = null; gameState.supabaseUserEmail = null;
        perbaruiTampilanMenuAuthUI(); tulisLogKeamanan("Auth: Sesi diakhiri."); alert("Berhasil keluar.");
    }

    function perbaruiTampilanMenuAuthUI() {
        const divKeluar = document.getElementById('section-logged-out');
        const divMasuk = document.getElementById('section-logged-in');
        const txtEmail = document.getElementById('logged-email-text');
        if (gameState.supabaseUserToken) {
            if(divKeluar) divKeluar.style.display = "none";
            if(divMasuk) divMasuk.style.display = "block";
            if(txtEmail) txtEmail.textContent = `Terhubung: ${gameState.supabaseUserEmail}`;
        } else {
            if(divKeluar) divKeluar.style.display = "block";
            if(divMasuk) divMasuk.style.display = "none";
        }
        verifikasiStatusKoneksiJaringan();
    }

    // =========================================================================
    // 💾 MANUAL SINKRONISASI CLOUD
    // =========================================================================
    async function manualSaveToCloud() {
        if (!gameState.supabaseUserToken) return;
        try { await syncDataToCPanelServer(); alert("Progress aman di Cloud!"); } catch(e) { }
    }

    async function manualLoadFromCloud() {
        if (!gameState.supabaseUserToken || !navigator.onLine || !SUPABASE_API_URL) return;
        try {
            const res = await fetch(`${SUPABASE_API_URL}?select=*&account_id=eq.${gameState.accountId}`, {
                method: "GET", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": SUPABASE_ANON_KEY }
            });
            const data = await res.json();
            if(data && data.length > 0) {
                const cloudProfile = data[0];
                gameState.playerName = cloudProfile.player_name;
                gameState.score = parseFloat(cloudProfile.score) || 0;
                gameState.totalEnergyAllTime = parseFloat(cloudProfile.total_energy_all_time) || 0;
                gameState.clickLevel = cloudProfile.click_level || 1;
                gameState.autoLevel = cloudProfile.auto_level || 0;
                
                saveGame(); updateUI();
                alert("Progress diunduh dari cloud!");
                tulisLogKeamanan("Cloud Load: Pemulihan progress berhasil.");
            } else { alert("Data cloud tidak ditemukan."); }
        } catch(e) { }
    }

    // =========================================================================
    // 💬 CHAT GLOBAL
    // =========================================================================
    async function bukaModalChatJaringan() { document.getElementById('chat-overlay').classList.add('active'); await muatPesanChatDariServer(); }
    
    async function muatPesanChatDariServer() {
        const wadahChat = document.getElementById('chat-box-messages');
        if (!wadahChat || !navigator.onLine || !SUPABASE_CHAT_URL) return;
        try {
            const res = await fetch(`${SUPABASE_CHAT_URL}?select=*&order=created_at.desc&limit=30`, {
                method: "GET", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": SUPABASE_ANON_KEY }
            });
            const listChat = await res.json();
            wadahChat.innerHTML = "";
            listChat.reverse().forEach(chat => {
                const item = document.createElement('div'); const isSaya = chat.sender_id === gameState.accountId;
                item.style.padding = "6px 10px"; item.style.borderRadius = "8px"; item.style.fontSize = "11px"; item.style.maxWidth = "85%"; item.style.marginBottom = "4px";
                if (isSaya) { item.style.background = "rgba(0, 242, 254, 0.15)"; item.style.alignSelf = "flex-end"; item.style.border = "1px solid rgba(0, 242, 254, 0.3)"; } else { item.style.background = "rgba(255, 255, 255, 0.05)"; item.style.alignSelf = "flex-start"; item.style.border = "1px solid rgba(255, 255, 255, 0.1)"; }
                item.innerHTML = `<span style="font-weight:bold; color:${isSaya ? '#00f2fe' : '#ff9f43'};">${chat.sender_name}</span><br>${chat.message}`;
                wadahChat.appendChild(item);
            });
            wadahChat.scrollTop = wadahChat.scrollHeight;
        } catch (e) {}
    }

    async function kirimPesanChatKeServer() {
        const input = document.getElementById('input-chat-message');
        if (!input || input.value.trim() === "" || !navigator.onLine || !SUPABASE_CHAT_URL) return;
        try {
            await fetch(SUPABASE_CHAT_URL, {
                method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": SUPABASE_ANON_KEY },
                body: JSON.stringify({ sender_id: gameState.accountId, sender_name: gameState.playerName, message: input.value.trim() })
            });
            input.value = ""; await muatPesanChatDariServer();
        } catch (e) {}
    }

    // =========================================================================
    // 📡 BACKGROUND AUTOMATIC CLOUD SYNC
    // =========================================================================
    async function syncDataToCPanelServer() {
        if (!navigator.onLine || !SUPABASE_API_URL) return; 
        try {
            const payload = {
                account_id: gameState.accountId, player_name: gameState.playerName, score: gameState.score, total_energy_all_time: gameState.totalEnergyAllTime, click_level: gameState.clickLevel, auto_level: gameState.autoLevel, friends: gameState.friendsList, likes: gameState.playerLikes, updated_at: new Date().toISOString()
            };
            const urlDenganKonflik = `${SUPABASE_API_URL}?on_conflict=account_id`;
            await fetch(urlDenganKonflik, {
                method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": SUPABASE_ANON_KEY, "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify(payload)
            });
        } catch (error) {}
    }

    // =========================================================================
    // 🏆 PAPAN PERINGKAT RANKING GLOBAL
    // =========================================================================
    async function muatPapanPeringkatDariServer() {
        const wadahLeaderboard = document.getElementById('leaderboard-html-container');
        if (!wadahLeaderboard) return;
        if (!navigator.onLine) { wadahLeaderboard.innerHTML = `<div style="padding:20px; font-size:11px; color:#ff4757; text-align:center;">⚠️ Mode Offline.</div>`; return; }
        try {
            wadahLeaderboard.innerHTML = `<div style="padding:20px; font-size:11px; color:#00f2fe; text-align:center;">Menghubungkan ke database...</div>`;
            const res = await fetch(`${SUPABASE_API_URL}?select=*&order=total_energy_all_time.desc&limit=20`, { method: "GET", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": SUPABASE_ANON_KEY } });
            if (!res.ok) throw new Error();
            const listTopRank = await res.json();
            wadahLeaderboard.innerHTML = ""; JARINGAN_PLAYER_CACHE = {}; 
            listTopRank.forEach((player, indeks) => {
                JARINGAN_PLAYER_CACHE[player.account_id] = player;
                const baris = document.createElement('div'); baris.className = "ios-list-item"; baris.style.cursor = "pointer";
                let medali = `${indeks + 1}. `; if (indeks === 0) medali = "🥇 "; else if (indeks === 1) medali = "🥈 "; else if (indeks === 2) medali = "🥉 ";
                const scoreAllTime = parseFloat(player.total_energy_all_time) || 0;
                baris.innerHTML = `<div style="display:flex; flex-direction:column;"><span style="font-weight:bold; color:#fff;">${medali}${player.player_name}</span><span style="font-size:8px; color:#52527a; font-family:monospace; margin-top:1px;">UID: ${player.account_id}</span></div><span class="item-right">${formatAngka(scoreAllTime)} <span style="font-size:7px; color:#6a6a9f;">E</span></span>`;
                baris.addEventListener('click', () => { bukaModalInspectSosial(player.account_id); });
                wadahLeaderboard.appendChild(baris);
            });
        } catch (e) { wadahLeaderboard.innerHTML = `<div style="padding:20px; font-size:11px; color:#ff4757; text-align:center;">🚫 Gagal memuat peringkat.</div>`; }
    }

    // =========================================================================
    // 👤 POP UP INSPEKSI AKUN
    // =========================================================================
    async function bukaModalInspectSosial(targetId) {
        currentInspectTargetId = targetId; if (!socialInspectModal) return;
        let pData = JARINGAN_PLAYER_CACHE[targetId];
        if (!pData && navigator.onLine && SUPABASE_API_URL) {
            try {
                const res = await fetch(`${SUPABASE_API_URL}?select=*&account_id=eq.${targetId}`, { method: "GET", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": SUPABASE_ANON_KEY } });
                const data = await res.json(); if (data && data.length > 0) { pData = data[0]; JARINGAN_PLAYER_CACHE[targetId] = pData; }
            } catch(e){}
        }
        if (!pData) { alert("Profil tidak ditemukan."); return; }

        socialInspectModal.classList.add('active');
        if(inspectName) inspectName.textContent = pData.player_name;
        if(inspectId) inspectId.textContent = "ID: " + pData.account_id;
        if(inspectCps) inspectCps.textContent = formatAngka(pData.total_energy_all_time || 0);
        if(inspectLikes) inspectLikes.textContent = `${pData.likes || 0}`;

        const isAkunSendiri = targetId === gameState.accountId;
        if (isAkunSendiri) {
            if(btnActionFriend) btnActionFriend.style.display = "none"; if(btnActionLike) btnActionLike.style.display = "none"; if(btnActionReport) btnActionReport.style.display = "none";
        } else {
            if(btnActionFriend) {
                btnActionFriend.style.display = "block"; const isTeman = gameState.friendsList.includes(targetId);
                btnActionFriend.textContent = isTeman ? "Putuskan Aliansi" : "Tambah Teman";
                btnActionFriend.style.background = isTeman ? "rgba(255, 71, 87, 0.1)" : "rgba(0, 242, 254, 0.1)";
                btnActionFriend.style.color = isTeman ? "#ff4757" : "#00f2fe";
            }
            if(btnActionLike) btnActionLike.style.display = "block"; if(btnActionReport) btnActionReport.style.display = "block";
        }
    }

    async function prosesKirimLikeKeTarget() {
        if (!currentInspectTargetId || !navigator.onLine || !SUPABASE_API_URL) return;
        let targetData = JARINGAN_PLAYER_CACHE[currentInspectTargetId]; if (!targetData) return;
        try {
            const totalLikeBaru = (targetData.likes || 0) + 1;
            await fetch(`${SUPABASE_API_URL}?account_id=eq.${currentInspectTargetId}`, {
                method: "PATCH", headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": SUPABASE_ANON_KEY },
                body: JSON.stringify({ likes: totalLikeBaru })
            });
            targetData.likes = totalLikeBaru; if(inspectLikes) inspectLikes.textContent = `${totalLikeBaru}`;
            tulisLogKeamanan(`Kamu mengirimkan like ke Agen ID: ${currentInspectTargetId}`);
        } catch(e) {}
    }

    function saveGame() { gameState.lastSavedTime = Date.now(); localStorage.setItem('cyberTap_saveData_secured', enkripsiData(JSON.stringify(gameState))); }

    function loadGame() {
        const savedDataEncrypted = localStorage.getItem('cyberTap_saveData_secured');
        if (savedDataEncrypted) {
            try {
                const decryptedText = dekripsiData(savedDataEncrypted); const parsed = JSON.parse(decryptedText);
                if (parsed.accountId && parsed.accountId !== "" && parsed.accountId.length >= 8) { gameState = { ...gameState, ...parsed }; } else { gameState = { ...gameState, ...parsed }; gameState.accountId = buatIDNumericUnik(); }
                if (gameState.maxBatteryCapacity === undefined) gameState.maxBatteryCapacity = 18000; if (gameState.batteryUpgradeCost === undefined) gameState.batteryUpgradeCost = 1000; if (gameState.isMusicSavedOn === undefined) gameState.isMusicSavedOn = false;
                if (!gameState.securityLogs) gameState.securityLogs = [];
                // 🆕 Initialize item baru jika undefined
                if (gameState.novaLevel === undefined) gameState.novaLevel = 0;
                if (gameState.singularityLevel === undefined) gameState.singularityLevel = 0;
                if (gameState.infinityLevel === undefined) gameState.infinityLevel = 0;
                if (gameState.omegaLevel === undefined) gameState.omegaLevel = 0;
                if (gameState.godLevel === undefined) gameState.godLevel = 0;
                tculDataAwalSocialDOM();
                if (gameState.isMusicSavedOn) { setTimeout(() => { initAudioEngine(); playCyberBacksound(); isMusicPlaying = true; if(btnMusicToggle) { btnMusicToggle.textContent = "Matikan Musik"; } }, 800); }
                hitungOfflineProgress();
            } catch (e) { gameState.accountId = buatIDNumericUnik(); }
        } else { gameState.accountId = buatIDNumericUnik(); gameState.securityLogs = []; tculDataAwalSocialDOM(); }
        perbaruiTampilanMenuAuthUI();
    }

    // DOM Elements
    const scoreDisplay = document.getElementById('score-display'); const tapPowerDisplay = document.getElementById('tap-power-display'); const autoSpeedDisplay = document.getElementById('auto-speed-display'); const tapBtn = document.getElementById('tap-btn'); const tapArea = document.getElementById('tap-area'); const accountIdDisplay = document.getElementById('account-id-display'); const playerNameInput = document.getElementById('player-name-input'); const myLikesCount = document.getElementById('my-likes-count'); const searchPlayerInput = document.getElementById('search-player-input'); const btnSearchPlayer = document.getElementById('btn-search-player'); const friendsContainerList = document.getElementById('friends-container-list'); const visitorContainerList = document.getElementById('visitor-container-list'); const friendCountTxt = document.getElementById('friend-count-txt'); const socialInspectModal = document.getElementById('social-inspect-modal'); const inspectName = document.getElementById('inspect-name'); const inspectId = document.getElementById('inspect-id'); const inspectCps = document.getElementById('inspect-cps'); const inspectLikes = document.getElementById('inspect-likes'); const btnActionFriend = document.getElementById('btn-add-friend-action'); const btnActionLike = document.getElementById('btn-action-like'); const btnActionReport = document.getElementById('btn-action-report'); const btnCloseInspect = document.getElementById('btn-close-inspect'); const btnMusicToggle = document.getElementById('btn-music-toggle'); const btnUpgradeBattery = document.getElementById('btn-upgrade-battery');
    const upgClickCost = document.getElementById('upg-click-cost'); const upgClickCount = document.getElementById('upg-click-count'); const upgClickCard = document.getElementById('upg-click');
    const upgAutoCost = document.getElementById('upg-auto-cost'); const upgAutoCount = document.getElementById('upg-auto-count'); const upgAutoCard = document.getElementById('upg-auto'); const upgAutoDesc = document.getElementById('upg-auto-desc');
    const upgQuantumCost = document.getElementById('upg-quantum-cost'); const upgQuantumCount = document.getElementById('upg-quantum-count'); const upgQuantumCard = document.getElementById('upg-quantum'); const upgQuantumDesc = document.getElementById('upg-quantum-desc');
    const upgAntimatterCost = document.getElementById('upg-antimatter-cost'); const upgAntimatterCount = document.getElementById('upg-antimatter-count'); const upgAntimatterCard = document.getElementById('upg-antimatter'); const upgAntimatterDesc = document.getElementById('upg-antimatter-desc');
    const upgDysonCost = document.getElementById('upg-dyson-cost'); const upgDysonCount = document.getElementById('upg-dyson-count'); const upgDysonCard = document.getElementById('upg-dyson'); const upgDysonDesc = document.getElementById('upg-dyson-desc');
    // 🆕 5 ITEM BARU
    const upgNovaCost = document.getElementById('upg-nova-cost'); const upgNovaCount = document.getElementById('upg-nova-count'); const upgNovaCard = document.getElementById('upg-nova'); const upgNovaDesc = document.getElementById('upg-nova-desc');
    const upgSingularityCost = document.getElementById('upg-singularity-cost'); const upgSingularityCount = document.getElementById('upg-singularity-count'); const upgSingularityCard = document.getElementById('upg-singularity'); const upgSingularityDesc = document.getElementById('upg-singularity-desc');
    const upgInfinityCost = document.getElementById('upg-infinity-cost'); const upgInfinityCount = document.getElementById('upg-infinity-count'); const upgInfinityCard = document.getElementById('upg-infinity'); const upgInfinityDesc = document.getElementById('upg-infinity-desc');
    const upgOmegaCost = document.getElementById('upg-omega-cost'); const upgOmegaCount = document.getElementById('upg-omega-count'); const upgOmegaCard = document.getElementById('upg-omega'); const upgOmegaDesc = document.getElementById('upg-omega-desc');
    const upgGodCost = document.getElementById('upg-god-cost'); const upgGodCount = document.getElementById('upg-god-count'); const upgGodCard = document.getElementById('upg-god'); const upgGodDesc = document.getElementById('upg-god-desc');
    // --- END 5 ITEM BARU ---
    const upgAutoClickCost = document.getElementById('upg-autoclick-cost'); const upgAutoClickCount = document.getElementById('upg-autoclick-count'); const upgAutoClickCard = document.getElementById('upg-autoclick'); const upgAutoClickDesc = document.getElementById('upg-autoclick-desc');
    const autoUpgradeTimerDisplay = document.getElementById('auto-upgrade-timer'); const btnRefuelAction = document.getElementById('btn-refuel-action'); const logTerminalDisplay = document.getElementById('log-terminal-display'); const listTargetItems = document.querySelectorAll('.clickable-target'); const navItems = document.querySelectorAll('.nav-item'); const iosAlertDialog = document.getElementById('ios-alert-dialog'); const resetTrigger = document.getElementById('reset-trigger'); const alertCancel = document.getElementById('alert-cancel'); const alertConfirm = document.getElementById('alert-confirm'); const statEnergyAllTime = document.getElementById('stat-energy-alltime'); const statTotalClicks = document.getElementById('stat-total-clicks'); const statEnergySpent = document.getElementById('stat-energy-spent'); const btnRefreshLeaderboard = document.getElementById('btn-refresh-leaderboard');

    function tculDataAwalSocialDOM() { if(playerNameInput) playerNameInput.value = gameState.playerName; }

    function updateUI() {
        if(scoreDisplay) scoreDisplay.textContent = formatAngka(gameState.score); if(tapPowerDisplay) tapPowerDisplay.textContent = formatAngka(gameState.clickPower); if(autoSpeedDisplay) autoSpeedDisplay.textContent = formatAngka(gameState.autoTappers); if(accountIdDisplay) accountIdDisplay.textContent = "ID: " + (gameState.accountId || "00000000"); if(myLikesCount) myLikesCount.textContent = `❤️ ${gameState.playerLikes}`; if(statEnergyAllTime) statEnergyAllTime.textContent = formatAngka(gameState.totalEnergyAllTime || 0); if(statTotalClicks) statTotalClicks.textContent = formatAngka(gameState.totalClicks || 0); if(statEnergySpent) statEnergySpent.textContent = formatAngka(gameState.totalEnergySpent || 0);
        renderDaftarTemanUI(); renderRiwayatPengunjungUI();

        if (btnUpgradeBattery) { let limitJam = Math.floor(gameState.maxBatteryCapacity / 3600); btnUpgradeBattery.textContent = `🔋 Upgrade Kapasitas Inti (+1 Jam) | Cost: ${formatAngka(gameState.batteryUpgradeCost)}`; }
        let isDroneUnlocked = gameState.clickLevel >= 10; 
        let isQuantumUnlocked = gameState.autoLevel >= 10; 
        let isAntimatterUnlocked = gameState.quantumLevel >= 10; 
        let isDysonUnlocked = gameState.antimatterLevel >= 10;
        // 🆕 UNLOCK CONDITIONS UNTUK 5 ITEM BARU
        let isNovaUnlocked = gameState.dysonLevel >= 10;
        let isSingularityUnlocked = gameState.novaLevel >= 10;
        let isInfinityUnlocked = gameState.singularityLevel >= 10;
        let isOmegaUnlocked = gameState.infinityLevel >= 10;
        let isGodUnlocked = gameState.omegaLevel >= 10;
        
        if(upgClickCost) upgClickCost.textContent = formatAngka(gameState.clickUpgradeCost); if(upgClickCount) upgClickCount.textContent = `Lv ${gameState.clickLevel}`; if(upgClickCard) upgClickCard.classList.toggle('disabled', gameState.score < gameState.clickUpgradeCost);
        if (upgAutoCard) { if (isDroneUnlocked) { upgAutoCost.textContent = formatAngka(gameState.autoUpgradeCost); upgAutoCount.textContent = `Lv ${gameState.autoLevel}`; upgAutoCard.classList.toggle('disabled', gameState.score < gameState.autoUpgradeCost); } else { upgAutoCost.textContent = "🔒"; upgAutoCount.textContent = "Locked"; upgAutoCard.classList.add('disabled'); } }
        if (upgQuantumCard) { if (isQuantumUnlocked) { upgQuantumCost.textContent = formatAngka(gameState.quantumUpgradeCost); upgQuantumCount.textContent = `Lv ${gameState.quantumLevel}`; upgQuantumCard.classList.toggle('disabled', gameState.score < gameState.quantumUpgradeCost); } else { upgQuantumCost.textContent = "🔒"; upgQuantumCount.textContent = "Locked"; upgQuantumCard.classList.add('disabled'); } }
        if (upgAntimatterCard) { if (isAntimatterUnlocked) { upgAntimatterCost.textContent = formatAngka(gameState.antimatterUpgradeCost); upgAntimatterCount.textContent = `Lv ${gameState.antimatterLevel}`; upgAntimatterCard.classList.toggle('disabled', gameState.score < gameState.antimatterUpgradeCost); } else { upgAntimatterCost.textContent = "🔒"; upgAntimatterCount.textContent = "Locked"; upgAntimatterCard.classList.add('disabled'); } }
        if (upgDysonCard) { if (isDysonUnlocked) { upgDysonCost.textContent = formatAngka(gameState.dysonUpgradeCost); upgDysonCount.textContent = `Lv ${gameState.dysonLevel}`; upgDysonCard.classList.toggle('disabled', gameState.score < gameState.dysonUpgradeCost); } else { upgDysonCost.textContent = "🔒"; upgDysonCount.textContent = "Locked"; upgDysonCard.classList.add('disabled'); } }
        
        // 🆕 UPDATE UI UNTUK 5 ITEM BARU
        if (upgNovaCard) { if (isNovaUnlocked) { upgNovaCost.textContent = formatAngka(gameState.novaUpgradeCost); upgNovaCount.textContent = `Lv ${gameState.novaLevel}`; upgNovaCard.classList.toggle('disabled', gameState.score < gameState.novaUpgradeCost); } else { upgNovaCost.textContent = "🔒"; upgNovaCount.textContent = "Locked"; upgNovaCard.classList.add('disabled'); } }
        if (upgSingularityCard) { if (isSingularityUnlocked) { upgSingularityCost.textContent = formatAngka(gameState.singularityUpgradeCost); upgSingularityCount.textContent = `Lv ${gameState.singularityLevel}`; upgSingularityCard.classList.toggle('disabled', gameState.score < gameState.singularityUpgradeCost); } else { upgSingularityCost.textContent = "🔒"; upgSingularityCount.textContent = "Locked"; upgSingularityCard.classList.add('disabled'); } }
        if (upgInfinityCard) { if (isInfinityUnlocked) { upgInfinityCost.textContent = formatAngka(gameState.infinityUpgradeCost); upgInfinityCount.textContent = `Lv ${gameState.infinityLevel}`; upgInfinityCard.classList.toggle('disabled', gameState.score < gameState.infinityUpgradeCost); } else { upgInfinityCost.textContent = "🔒"; upgInfinityCount.textContent = "Locked"; upgInfinityCard.classList.add('disabled'); } }
        if (upgOmegaCard) { if (isOmegaUnlocked) { upgOmegaCost.textContent = formatAngka(gameState.omegaUpgradeCost); upgOmegaCount.textContent = `Lv ${gameState.omegaLevel}`; upgOmegaCard.classList.toggle('disabled', gameState.score < gameState.omegaUpgradeCost); } else { upgOmegaCost.textContent = "🔒"; upgOmegaCount.textContent = "Locked"; upgOmegaCard.classList.add('disabled'); } }
        if (upgGodCard) { if (isGodUnlocked) { upgGodCost.textContent = formatAngka(gameState.godUpgradeCost); upgGodCount.textContent = `Lv ${gameState.godLevel}`; upgGodCard.classList.toggle('disabled', gameState.score < gameState.godUpgradeCost); } else { upgGodCost.textContent = "🔒"; upgGodCount.textContent = "Locked"; upgGodCard.classList.add('disabled'); } }
        
        if(upgAutoClickCost) upgAutoClickCost.textContent = formatAngka(gameState.autoClickCost); if(upgAutoClickCount) upgAutoClickCount.textContent = `Lv ${gameState.autoClickLevel}`; if(upgAutoClickCard) upgAutoClickCard.classList.toggle('disabled', gameState.score < gameState.autoClickCost);
        
        if(gameState.autoClickLevel > 0) { let hitungDetikCepat = (5 - (gameState.autoClickLevel * 0.1)).toFixed(1); if(hitungDetikCepat < 0.5) hitungDetikCepat = 0.5; if(upgAutoClickDesc) upgAutoClickDesc.textContent = `Ngetap otomatis 1x / ${hitungDetikCepat} dtk (Aktif Offline)${gameState.autoUpgradeTimer <= 0 ? " [MOGOK DAYA]" : ""}`; }
        if(autoUpgradeTimerDisplay) { autoUpgradeTimerDisplay.textContent = formatWaktu(gameState.autoUpgradeTimer); autoUpgradeTimerDisplay.style.color = gameState.autoUpgradeTimer <= 0 ? "#ff4757" : "#34c759"; }
        
        let refuelCost = hitungHargaRefuelBaterai(); 
        if(btnRefuelAction) { btnRefuelAction.textContent = `Isi Daya (Cost: ${formatAngka(refuelCost)})`; btnRefuelAction.classList.toggle('disabled', !((gameState.autoUpgradeTimer < gameState.maxBatteryCapacity) && (gameState.score >= refuelCost))); }
        
        // 🟢 FIX 100%: FITUR AUTO-UPGRADE STATUS UPDATE
        listTargetItems.forEach(item => { 
            const tipeTarget = item.getAttribute('data-target-item'); 
            const txtStatus = document.getElementById(`status-${tipeTarget}`);
            if (gameState.autoUpgradeTarget === tipeTarget) { 
                item.style.background = "rgba(0, 242, 254, 0.05)";
                if(txtStatus) { 
                    txtStatus.textContent = gameState.autoUpgradeTimer <= 0 ? "Mogok" : "Aktif"; 
                    txtStatus.style.color = gameState.autoUpgradeTimer <= 0 ? "#ff4757" : "#34c759"; 
                }
            } else { 
                item.style.background = "transparent";
                if(txtStatus) { 
                    txtStatus.textContent = "Mati"; 
                    txtStatus.style.color = "#6a6a9f"; 
                }
            } 
        });
        
        // 🟢 FIX 100%: LOG TERMINAL BALIK NORMAL SEPERTI AWAL
        if (logTerminalDisplay) { 
            logTerminalDisplay.innerHTML = ""; 
            if (gameState.securityLogs && gameState.securityLogs.length > 0) {
                gameState.securityLogs.forEach(log => { 
                    const baris = document.createElement('div'); 
                    baris.className = log.alert ? "log-row alert-type" : "log-row"; 
                    baris.textContent = `[${log.time}] ${log.text}`; 
                    logTerminalDisplay.appendChild(baris); 
                }); 
            } else {
                logTerminalDisplay.innerHTML = `<div class="log-row">[00:00:00] Sandbox kernel initialized. Ready.</div>`;
            }
        }
    }

    function renderDaftarTemanUI() {
        if (!friendsContainerList) return; friendsContainerList.innerHTML = ""; if (gameState.friendsList.length === 0) { friendsContainerList.innerHTML = `<div style="font-size:11px; color:#52527a; text-align:center; padding:10px;">Belum ada aliansi terdaftar.</div>`; if (friendCountTxt) friendCountTxt.textContent = "0"; return; }
        if (friendCountTxt) friendCountTxt.textContent = gameState.friendsList.length;
        gameState.friendsList.forEach(fid => { const card = document.createElement('div'); card.className = "friend-item-card"; card.innerHTML = `<div class="fr-left"><div class="fr-name">🤝 Jaringan Agen</div><span class="fr-sub">ID: ${fid}</span></div>`; card.addEventListener('click', () => { bukaModalInspectSosial(fid); }); friendsContainerList.appendChild(card); });
    }

    function renderRiwayatPengunjungUI() {
        if (!visitorContainerList) return; visitorContainerList.innerHTML = ""; if (gameState.visitorHistory.length === 0) { visitorContainerList.innerHTML = `<div style="font-size:10px; color:#52527a; text-align:center; padding:5px;">Belum ada aktivitas deteksi radar.</div>`; return; }
        gameState.visitorHistory.forEach(v => { const baris = document.createElement('div'); baris.className = "visitor-row"; baris.innerHTML = `<span>👁️ <strong>${v.name}</strong> memonitor profil</span><span style="font-family:monospace;">${v.time}</span>`; baris.addEventListener('click', function(e) { e.preventDefault(); bukaModalInspectSosial(v.id); }); visitorContainerList.appendChild(baris); });
    }

    // TAB NAVIGATION
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.nav-item.active').classList.remove('active'); item.classList.add('active');
            const targetPageId = item.getAttribute('data-target'); document.querySelector('.page.active').classList.remove('active');
            document.getElementById(targetPageId).classList.add('active');
            if (targetPageId === "page-leaderboard") { muatPapanPeringkatDariServer(); }
            verifikasiStatusKoneksiJaringan();
        });
    });

    if (btnRefreshLeaderboard) { btnRefreshLeaderboard.addEventListener('click', () => { muatPapanPeringkatDariServer(); }); }

    if(tapBtn) { tapBtn.addEventListener('click', (e) => { initAudioEngine(); gameState.score += gameState.clickPower; gameState.totalClicks += 1; gameState.totalEnergyFromClicks += gameState.clickPower; gameState.totalEnergyAllTime += gameState.clickPower; playTapSFX(); createFloatingText(e); updateUI(); saveGame(); }); }
    
    // 🟢 FIX 100%: KLIK TARGET AUTO-UPGRADE TANPA ERROR MINTA COST
    listTargetItems.forEach(item => { 
        item.addEventListener('click', () => { 
            initAudioEngine(); 
            const targetDipilih = item.getAttribute('data-target-item'); 
            if (gameState.autoUpgradeTarget === targetDipilih) { 
                gameState.autoUpgradeTarget = "none"; 
                tulisLogKeamanan("Otomatisasi upgrade dinonaktifkan."); 
            } else { 
                gameState.autoUpgradeTarget = targetDipilih; 
                tulisLogKeamanan(`Target otomatisasi dialihkan ke: ${targetDipilih.toUpperCase()}`); 
            } 
            updateUI(); 
            saveGame(); 
        }); 
    });

    if (btnUpgradeBattery) { btnUpgradeBattery.addEventListener('click', () => { initAudioEngine(); if (gameState.score >= gameState.batteryUpgradeCost) { gameState.score -= gameState.batteryUpgradeCost; gameState.totalEnergySpent += gameState.batteryUpgradeCost; gameState.maxBatteryCapacity += 3600; gameState.autoUpgradeTimer += 3600; tulisLogKeamanan(`Kapasitas operasional modul diperluas.`); gameState.batteryUpgradeCost = Math.floor(gameState.batteryUpgradeCost * 2.5); updateUI(); saveGame(); } else { alert("⚡ Energi tidak cukup!"); } }); }
    if (btnMusicToggle) { btnMusicToggle.addEventListener('click', () => { initAudioEngine(); if (isMusicPlaying) { hentikanCyberBacksound(); btnMusicToggle.textContent = "Mulai Musik"; isMusicPlaying = false; gameState.isMusicSavedOn = false; } else { playCyberBacksound(); btnMusicToggle.textContent = "Matikan Musik"; isMusicPlaying = true; gameState.isMusicSavedOn = true; } saveGame(); }); }
    if(btnRefuelAction) { btnRefuelAction.addEventListener('click', () => { let refuelCost = hitungHargaRefuelBaterai(); if (gameState.autoUpgradeTimer < gameState.maxBatteryCapacity && gameState.score >= refuelCost) { gameState.score -= refuelCost; gameState.totalEnergySpent += refuelCost; gameState.autoUpgradeTimer = gameState.maxBatteryCapacity; tulisLogKeamanan("Daya tangki modul diisi penuh."); updateUI(); saveGame(); } }); }
    if(accountIdDisplay) accountIdDisplay.addEventListener('click', () => { navigator.clipboard.writeText(gameState.accountId); alert("ID tersalin ke clipboard!"); });
    if(inspectId) inspectId.addEventListener('click', () => { navigator.clipboard.writeText(inspectId.textContent.replace("ID: ", "")); alert("ID target disalin!"); });
    if(btnCloseInspect) btnCloseInspect.addEventListener('click', () => socialInspectModal.classList.remove('active'));
    
    if (playerNameInput) { playerNameInput.addEventListener('change', () => { let namaBaru = playerNameInput.value.trim(); if (namaBaru === "") namaBaru = "Hozinking"; gameState.playerName = namaBaru; saveGame(); updateUI(); }); }
    if (btnSearchPlayer && searchPlayerInput) { btnSearchPlayer.addEventListener('click', () => { const targetId = searchPlayerInput.value.trim(); if (targetId === "" || targetId === gameState.accountId) return; bukaModalInspectSosial(targetId); searchPlayerInput.value = ""; }); }
    
    if (btnActionFriend) { 
        btnActionFriend.addEventListener('click', () => { 
            if (!currentInspectTargetId) return; 
            if (gameState.friendsList.includes(currentInspectTargetId)) { gameState.friendsList = gameState.friendsList.filter(id => id !== currentInspectTargetId); } else { gameState.friendsList.push(currentInspectTargetId); } 
            saveGame(); bukaModalInspectSosial(currentInspectTargetId); updateUI(); 
        }); 
    }
    if (btnActionLike) { btnActionLike.addEventListener('click', () => { prosesKirimLikeKeTarget(); }); }
    if (btnActionReport) { btnActionReport.addEventListener('click', () => { if (!currentInspectTargetId) return; alert(`Laporan penyalahgunaan berhasil dikirim ke server pusat.`); socialInspectModal.classList.remove('active'); }); }
    
    // MODAL INPUT LOGIN / OTP TRIGGERS
    document.getElementById('btn-trigger-auth-modal')?.addEventListener('click', () => {
        document.getElementById('auth-form-credentials-layer').style.display = "block";
        document.getElementById('auth-form-otp-layer').style.display = "none";
        document.getElementById('auth-input-modal').classList.add('active');
    });
    document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
        document.getElementById('auth-input-modal').classList.remove('active');
    });

    document.getElementById('btn-register-cloud')?.addEventListener('click', () => { initAudioEngine(); prosesRegisterCloud(); });
    document.getElementById('btn-verify-otp-cloud')?.addEventListener('click', () => { initAudioEngine(); prosesVerifikasiOTPCloud(); });
    document.getElementById('btn-login-cloud')?.addEventListener('click', () => { initAudioEngine(); prosesLoginCloud(); });
    document.getElementById('btn-logout-cloud')?.addEventListener('click', () => { prosesLogoutCloud(); });
    document.getElementById('btn-manual-save-cloud')?.addEventListener('click', () => { manualSaveToCloud(); });
    document.getElementById('btn-manual-load-cloud')?.addEventListener('click', () => { manualLoadFromCloud(); });
    document.getElementById('btn-open-chat')?.addEventListener('click', () => { bukaModalChatJaringan(); });
    document.getElementById('btn-close-chat')?.addEventListener('click', () => { document.getElementById('chat-overlay').classList.remove('active'); });
    document.getElementById('btn-send-chat')?.addEventListener('click', () => { kirimPesanChatKeServer(); });

    // KLIK UPGRADE MANUAL
    if(upgClickCard) { upgClickCard.addEventListener('click', () => { if (gameState.score >= gameState.clickUpgradeCost) { gameState.totalEnergySpent += gameState.clickUpgradeCost; gameState.score -= gameState.clickUpgradeCost; gameState.clickPower += (1 + (gameState.clickUpgradeCost * 0.01)); gameState.clickLevel += 1; gameState.clickUpgradeCost = Math.floor(gameState.clickUpgradeCost * 1.6); updateUI(); saveGame(); } }); }
    if(upgAutoCard) { upgAutoCard.addEventListener('click', () => { if (gameState.clickLevel >= 10 && gameState.score >= gameState.autoUpgradeCost) { gameState.totalEnergySpent += gameState.autoUpgradeCost; gameState.score -= gameState.autoUpgradeCost; gameState.autoTappers += (1 + (gameState.autoUpgradeCost * 0.01)); gameState.autoLevel += 1; gameState.autoUpgradeCost = Math.floor(gameState.autoUpgradeCost * 1.5); updateUI(); saveGame(); } }); }
    if(upgQuantumCard) { upgQuantumCard.addEventListener('click', () => { if (gameState.autoLevel >= 10 && gameState.score >= gameState.quantumUpgradeCost) { gameState.totalEnergySpent += gameState.quantumUpgradeCost; gameState.score -= gameState.quantumUpgradeCost; gameState.autoTappers += (10 + (gameState.quantumUpgradeCost * 0.01)); gameState.quantumLevel += 1; gameState.quantumUpgradeCost = Math.floor(gameState.quantumUpgradeCost * 1.7); updateUI(); saveGame(); } }); }
    if(upgAntimatterCard) { upgAntimatterCard.addEventListener('click', () => { if (gameState.quantumLevel >= 10 && gameState.score >= gameState.antimatterUpgradeCost) { gameState.totalEnergySpent += gameState.antimatterUpgradeCost; gameState.score -= gameState.antimatterUpgradeCost; gameState.autoTappers += (75 + (gameState.antimatterUpgradeCost * 0.01)); gameState.antimatterLevel += 1; gameState.antimatterUpgradeCost = Math.floor(gameState.antimatterUpgradeCost * 1.8); updateUI(); saveGame(); } }); }
    if(upgDysonCard) { upgDysonCard.addEventListener('click', () => { if (gameState.antimatterLevel >= 10 && gameState.score >= gameState.dysonUpgradeCost) { gameState.totalEnergySpent += gameState.dysonUpgradeCost; gameState.score -= gameState.dysonUpgradeCost; gameState.autoTappers += (500 + (gameState.dysonUpgradeCost * 0.01)); gameState.dysonLevel += 1; gameState.dysonUpgradeCost = Math.floor(gameState.dysonUpgradeCost * 1.9); updateUI(); saveGame(); } }); }
    
    // 🆕 EVENT LISTENER UNTUK 5 ITEM BARU
    if(upgNovaCard) { upgNovaCard.addEventListener('click', () => { if (gameState.dysonLevel >= 10 && gameState.score >= gameState.novaUpgradeCost) { gameState.totalEnergySpent += gameState.novaUpgradeCost; gameState.score -= gameState.novaUpgradeCost; gameState.autoTappers += (5000 + (gameState.novaUpgradeCost * 0.01)); gameState.novaLevel += 1; gameState.novaUpgradeCost = Math.floor(gameState.novaUpgradeCost * 2.0); updateUI(); saveGame(); } }); }
    if(upgSingularityCard) { upgSingularityCard.addEventListener('click', () => { if (gameState.novaLevel >= 10 && gameState.score >= gameState.singularityUpgradeCost) { gameState.totalEnergySpent += gameState.singularityUpgradeCost; gameState.score -= gameState.singularityUpgradeCost; gameState.autoTappers += (50000 + (gameState.singularityUpgradeCost * 0.01)); gameState.singularityLevel += 1; gameState.singularityUpgradeCost = Math.floor(gameState.singularityUpgradeCost * 2.1); updateUI(); saveGame(); } }); }
    if(upgInfinityCard) { upgInfinityCard.addEventListener('click', () => { if (gameState.singularityLevel >= 10 && gameState.score >= gameState.infinityUpgradeCost) { gameState.totalEnergySpent += gameState.infinityUpgradeCost; gameState.score -= gameState.infinityUpgradeCost; gameState.autoTappers += (500000 + (gameState.infinityUpgradeCost * 0.01)); gameState.infinityLevel += 1; gameState.infinityUpgradeCost = Math.floor(gameState.infinityUpgradeCost * 2.2); updateUI(); saveGame(); } }); }
    if(upgOmegaCard) { upgOmegaCard.addEventListener('click', () => { if (gameState.infinityLevel >= 10 && gameState.score >= gameState.omegaUpgradeCost) { gameState.totalEnergySpent += gameState.omegaUpgradeCost; gameState.score -= gameState.omegaUpgradeCost; gameState.autoTappers += (5000000 + (gameState.omegaUpgradeCost * 0.01)); gameState.omegaLevel += 1; gameState.omegaUpgradeCost = Math.floor(gameState.omegaUpgradeCost * 2.3); updateUI(); saveGame(); } }); }
    if(upgGodCard) { upgGodCard.addEventListener('click', () => { if (gameState.omegaLevel >= 10 && gameState.score >= gameState.godUpgradeCost) { gameState.totalEnergySpent += gameState.godUpgradeCost; gameState.score -= gameState.godUpgradeCost; gameState.autoTappers += (50000000 + (gameState.godUpgradeCost * 0.01)); gameState.godLevel += 1; gameState.godUpgradeCost = Math.floor(gameState.godUpgradeCost * 2.5); updateUI(); saveGame(); } }); }

    if(upgAutoClickCard) { upgAutoClickCard.addEventListener('click', () => { if (gameState.score >= gameState.autoClickCost) { gameState.totalEnergySpent += gameState.autoClickCost; gameState.score -= gameState.autoClickCost; gameState.autoClickLevel += 1; gameState.autoClickCost = Math.floor(gameState.autoClickCost * 2.2); updateUI(); saveGame(); } }); }

    function prosesMekanismeAutoUpgrade() {
        if (gameState.autoUpgradeTarget === "none" || gameState.autoUpgradeTimer <= 0) return;
        let dibeli = false;
        do {
            dibeli = false;
            if (gameState.autoUpgradeTarget === "glove" && gameState.score >= gameState.clickUpgradeCost) { 
                gameState.totalEnergySpent += gameState.clickUpgradeCost; gameState.score -= gameState.clickUpgradeCost; 
                gameState.clickPower += (1 + (gameState.clickUpgradeCost * 0.01)); gameState.clickLevel += 1; 
                gameState.clickUpgradeCost = Math.floor(gameState.clickUpgradeCost * 1.6); dibeli = true; 
            } 
            else if (gameState.autoUpgradeTarget === "drone" && gameState.clickLevel >= 10 && gameState.score >= gameState.autoUpgradeCost) { 
                gameState.totalEnergySpent += gameState.autoUpgradeCost; gameState.score -= gameState.autoUpgradeCost; 
                gameState.autoTappers += (1 + (gameState.autoUpgradeCost * 0.01)); gameState.autoLevel += 1; 
                gameState.autoUpgradeCost = Math.floor(gameState.autoUpgradeCost * 1.5); dibeli = true; 
            } 
            else if (gameState.autoUpgradeTarget === "quantum" && gameState.autoLevel >= 10 && gameState.score >= gameState.quantumUpgradeCost) { 
                gameState.totalEnergySpent += gameState.quantumUpgradeCost; gameState.score -= gameState.quantumUpgradeCost; 
                gameState.autoTappers += (10 + (gameState.quantumUpgradeCost * 0.01)); gameState.quantumLevel += 1; 
                gameState.quantumUpgradeCost = Math.floor(gameState.quantumUpgradeCost * 1.7); dibeli = true; 
            } 
            else if (gameState.autoUpgradeTarget === "antimatter" && gameState.quantumLevel >= 10 && gameState.score >= gameState.antimatterUpgradeCost) { 
                gameState.totalEnergySpent += gameState.antimatterUpgradeCost; gameState.score -= gameState.antimatterUpgradeCost; 
                gameState.autoTappers += (75 + (gameState.antimatterUpgradeCost * 0.01)); gameState.antimatterLevel += 1; 
                gameState.antimatterUpgradeCost = Math.floor(gameState.antimatterUpgradeCost * 1.8); dibeli = true; 
            }
            else if (gameState.autoUpgradeTarget === "dyson" && gameState.antimatterLevel >= 10 && gameState.score >= gameState.dysonUpgradeCost) { 
                gameState.totalEnergySpent += gameState.dysonUpgradeCost; gameState.score -= gameState.dysonUpgradeCost; 
                gameState.autoTappers += (500 + (gameState.dysonUpgradeCost * 0.01)); gameState.dysonLevel += 1; 
                gameState.dysonUpgradeCost = Math.floor(gameState.dysonUpgradeCost * 1.9); dibeli = true; 
            }
            // 🆕 AUTO-UPGRADE UNTUK 5 ITEM BARU
            else if (gameState.autoUpgradeTarget === "nova" && gameState.dysonLevel >= 10 && gameState.score >= gameState.novaUpgradeCost) { 
                gameState.totalEnergySpent += gameState.novaUpgradeCost; gameState.score -= gameState.novaUpgradeCost; 
                gameState.autoTappers += (5000 + (gameState.novaUpgradeCost * 0.01)); gameState.novaLevel += 1; 
                gameState.novaUpgradeCost = Math.floor(gameState.novaUpgradeCost * 2.0); dibeli = true; 
            }
            else if (gameState.autoUpgradeTarget === "singularity" && gameState.novaLevel >= 10 && gameState.score >= gameState.singularityUpgradeCost) { 
                gameState.totalEnergySpent += gameState.singularityUpgradeCost; gameState.score -= gameState.singularityUpgradeCost; 
                gameState.autoTappers += (50000 + (gameState.singularityUpgradeCost * 0.01)); gameState.singularityLevel += 1; 
                gameState.singularityUpgradeCost = Math.floor(gameState.singularityUpgradeCost * 2.1); dibeli = true; 
            }
            else if (gameState.autoUpgradeTarget === "infinity" && gameState.singularityLevel >= 10 && gameState.score >= gameState.infinityUpgradeCost) { 
                gameState.totalEnergySpent += gameState.infinityUpgradeCost; gameState.score -= gameState.infinityUpgradeCost; 
                gameState.autoTappers += (500000 + (gameState.infinityUpgradeCost * 0.01)); gameState.infinityLevel += 1; 
                gameState.infinityUpgradeCost = Math.floor(gameState.infinityUpgradeCost * 2.2); dibeli = true; 
            }
            else if (gameState.autoUpgradeTarget === "omega" && gameState.infinityLevel >= 10 && gameState.score >= gameState.omegaUpgradeCost) { 
                gameState.totalEnergySpent += gameState.omegaUpgradeCost; gameState.score -= gameState.omegaUpgradeCost; 
                gameState.autoTappers += (5000000 + (gameState.omegaUpgradeCost * 0.01)); gameState.omegaLevel += 1; 
                gameState.omegaUpgradeCost = Math.floor(gameState.omegaUpgradeCost * 2.3); dibeli = true; 
            }
            else if (gameState.autoUpgradeTarget === "god" && gameState.omegaLevel >= 10 && gameState.score >= gameState.godUpgradeCost) { 
                gameState.totalEnergySpent += gameState.godUpgradeCost; gameState.score -= gameState.godUpgradeCost; 
                gameState.autoTappers += (50000000 + (gameState.godUpgradeCost * 0.01)); gameState.godLevel += 1; 
                gameState.godUpgradeCost = Math.floor(gameState.godUpgradeCost * 2.5); dibeli = true; 
            }
        } while (dibeli);
    }

    if(resetTrigger) resetTrigger.addEventListener('click', () => iosAlertDialog.classList.add('active'));
    if(alertCancel) alertCancel.addEventListener('click', () => iosAlertDialog.classList.remove('active'));
    if(alertConfirm) { alertConfirm.addEventListener('click', () => { hentikanCyberBacksound(); localStorage.removeItem('cyberTap_saveData_secured'); location.reload(); }); }
    function hitungOfflineProgress() { if (gameState.lastSavedTime > 0) { let totalDetikOffline = Math.floor((Date.now() - gameState.lastSavedTime) / 1000); if (totalDetikOffline > 3) { let energi = totalDetikOffline * gameState.autoTappers; gameState.score += energi; gameState.totalEnergyAllTime += energi; } } }
    function createFloatingText(e) { if(!tapArea) return; const text = document.createElement('div'); text.className = 'floating-text'; text.textContent = `+${formatAngka(gameState.clickPower)}`; const rect = tapBtn.getBoundingClientRect(); let x = (e ? e.clientX : null) || (rect.left + rect.width / 2); let y = (e ? e.clientY : null) || (rect.top + rect.height / 2); const areaRect = tapArea.getBoundingClientRect(); text.style.left = `${x - areaRect.left}px`; text.style.top = `${y - areaRect.top}px`; const randomXOffset = (Math.random() - 0.5) * 20; text.style.transform = `translate(calc(-50% + ${randomXOffset}px), -50%)`; tapArea.appendChild(text); setTimeout(() => { text.remove(); }, 750); }

    // Engine Loops
    setInterval(() => {
        if (gameState.autoTappers > 0) { gameState.score += gameState.autoTappers; gameState.totalEnergyFromSeconds += gameState.autoTappers; gameState.totalEnergyAllTime += gameState.autoTappers; }
        let adaItemBantuAktif = (gameState.autoClickLevel > 0) || (gameState.autoUpgradeTarget !== "none");
        if (adaItemBantuAktif && gameState.autoUpgradeTimer > 0) { gameState.autoUpgradeTimer -= 1; }
        prosesMekanismeAutoUpgrade(); updateUI();
    }, 1000);

    setInterval(() => { if (gameState.autoClickLevel > 0 && gameState.autoUpgradeTimer > 0) { let jeda = 5 - (gameState.autoClickLevel * 0.1); if (jeda < 0.5) jeda = 0.5; gameState.score += gameState.clickPower; gameState.totalClicks += 1; const halDepan = document.getElementById('page-ringkasan'); if (halDepan && halDepan.classList.contains('active')) { createFloatingText(null); } updateUI(); } }, 1000);

    // AUTO-SAVE CLOUD BACKGROUND
    setInterval(() => { 
        saveGame(); syncDataToCPanelServer(); 
        if(document.getElementById('chat-overlay') && document.getElementById('chat-overlay').classList.contains('active')) { muatPesanChatDariServer(); }
    }, 5000);

    window.addEventListener('beforeunload', () => { saveGame(); });

    loadGame(); updateUI();

})();
