document.addEventListener('DOMContentLoaded', function() {
    var STORAGE_KEY = 'subscostcalc_subs';
    var subscriptions = loadSubscriptions();
    var listEl = document.getElementById('subscriptions-list');
    var emptyEl = document.getElementById('empty-state');
    var resultsEl = document.getElementById('results-card');
    var addBtn = document.getElementById('add-btn');
    var exampleBtn = document.getElementById('example-btn');
    var monthlyEl = document.getElementById('monthly-total');
    var yearlyEl = document.getElementById('yearly-total');
    var fiveYearEl = document.getElementById('five-year-total');
    var insightEl = document.getElementById('insight-text');
    var modalEl = document.getElementById('add-modal');
    var modalOverlay = document.getElementById('modal-overlay');
    var modalForm = document.getElementById('modal-form');
    var modalName = document.getElementById('modal-name');
    var modalCost = document.getElementById('modal-cost');
    var modalCycle = document.getElementById('modal-cycle');
    var modalSubmit = document.getElementById('modal-submit');
    var modalCancel = document.getElementById('modal-cancel');
    var modalTitle = document.getElementById('modal-title');
    var editId = null;
    var toastEl = document.getElementById('toast');
    var exportBtn = document.getElementById('export-btn');

    function showToast(msg, type) {
        type = type || 'success';
        toastEl.textContent = msg;
        toastEl.className = 'toast ' + type + ' show';
        setTimeout(function() { toastEl.className = 'toast ' + type; }, 2500);
    }

    function loadSubscriptions() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch(e) { return []; }
    }

    function saveSubscriptions() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions)); } catch(e) {}
    }

    function toMonthly(price, cycle) {
        if (cycle === 'yearly') return price / 12;
        return price;
    }

    function openModal() {
        editId = null;
        modalTitle.textContent = 'Add Subscription';
        modalName.value = '';
        modalCost.value = '';
        modalCycle.value = 'monthly';
        modalOverlay.style.display = 'flex';
        modalName.focus();
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        modalForm.reset();
        editId = null;
    }

    function openEditModal(id) {
        var sub = subscriptions[id];
        editId = id;
        modalTitle.textContent = 'Edit Subscription';
        modalName.value = sub.name;
        modalCost.value = sub.originalCost;
        modalCycle.value = sub.cycle;
        modalOverlay.style.display = 'flex';
        modalName.focus();
    }

    modalSubmit.addEventListener('click', function() {
        var name = modalName.value.trim();
        var cost = parseFloat(modalCost.value);
        var cycle = modalCycle.value;
        if (!name) { showToast('Please enter a subscription name', 'error'); return; }
        if (isNaN(cost) || cost <= 0) { showToast('Please enter a valid amount', 'error'); return; }
        if (editId !== null) {
            subscriptions[editId].name = name;
            subscriptions[editId].originalCost = cost;
            subscriptions[editId].cycle = cycle;
            subscriptions[editId].monthlyCost = toMonthly(cost, cycle);
            showToast('Subscription updated!');
        } else {
            subscriptions.push({
                name: name,
                originalCost: cost,
                cycle: cycle,
                monthlyCost: toMonthly(cost, cycle)
            });
            showToast('Subscription added!');
        }
        saveSubscriptions();
        closeModal();
        render();
    });

    modalCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();
    });

    function removeSub(id) {
        var name = subscriptions[id].name;
        subscriptions.splice(id, 1);
        saveSubscriptions();
        render();
        showToast('Deleted ' + name, 'error');
    }

    var examples = [
        { name: 'Netflix', cost: 22.99, cycle: 'monthly' },
        { name: 'Spotify', cost: 16.99, cycle: 'monthly' },
        { name: 'ChatGPT Plus', cost: 20.00, cycle: 'monthly' },
        { name: 'YouTube Premium', cost: 13.99, cycle: 'monthly' },
        { name: 'Adobe Creative Cloud', cost: 599.88, cycle: 'yearly' }
    ];

    if (exampleBtn) {
        exampleBtn.addEventListener('click', function() {
            subscriptions = examples.map(function(e) {
                return {
                    name: e.name,
                    originalCost: e.cost,
                    cycle: e.cycle,
                    monthlyCost: toMonthly(e.cost, e.cycle)
                };
            });
            saveSubscriptions();
            render();
            showToast('Example subscriptions loaded!');
        });
    }

    function render() {
        listEl.innerHTML = '';
        if (subscriptions.length === 0) {
            emptyEl.style.display = 'block';
            resultsEl.style.display = 'none';
            return;
        }
        emptyEl.style.display = 'none';
        resultsEl.style.display = 'block';
        for (var i = 0; i < subscriptions.length; i++) {
            var sub = subscriptions[i];
            var div = document.createElement('div');
            div.className = 'sub-card';
            var cycleText = sub.cycle === 'yearly' ? 
                'Yearly: $' + sub.originalCost.toFixed(2) + ' (≈$' + sub.monthlyCost.toFixed(2) + '/mo)' :
                'Monthly: $' + sub.originalCost.toFixed(2);
            div.innerHTML = '<div class="sub-info">' +
                '<span class="sub-name">' + escHtml(sub.name) + '</span>' +
                '<span class="sub-price">$' + sub.monthlyCost.toFixed(2) + '/mo</span>' +
                '<span class="sub-detail">' + cycleText + '</span>' +
                '</div>' +
                '<div class="sub-actions">' +
                '<button class="btn-edit" onclick="editSub(' + i + ')" title="Edit">&#9998;</button>' +
                '<button class="btn-delete" onclick="removeSub(' + i + ')" title="Delete">&#128465;</button>' +
                '</div>';
            listEl.appendChild(div);
        }
        calculate();
    }

    window.editSub = function(id) {
        openEditModal(id);
    };

    function calculate() {
        var monthly = 0;
        for (var i = 0; i < subscriptions.length; i++) {
            monthly += subscriptions[i].monthlyCost || 0;
        }
        var yearly = monthly * 12;
        var fiveYear = yearly * 5;
        monthlyEl.textContent = '$' + monthly.toFixed(2);
        yearlyEl.textContent = '$' + yearly.toFixed(2);
        fiveYearEl.textContent = '$' + fiveYear.toFixed(2);
        if (monthly > 0) {
            var msgs = [];
            if (monthly < 50) msgs.push('Nice! You spend less than $50/mo on subscriptions.');
            else if (monthly < 150) msgs.push('Moderate spending. Keep an eye on unused services.');
            else if (monthly < 300) msgs.push('At $' + monthly.toFixed(0) + '/mo, close to average. Review each one.');
            else msgs.push('At $' + monthly.toFixed(0) + '/mo, save $' + (monthly - 150).toFixed(0) + '/mo by cutting unused ones.');
            msgs.push('Over 5 years: <strong>$' + fiveYear.toFixed(0) + '</strong>.');
            insightEl.innerHTML = msgs.join(' ');
        } else {
            insightEl.innerHTML = '';
        }
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            if (subscriptions.length === 0) { showToast('No subscriptions to export', 'error'); return; }
            var csv = 'Name,Billing Cycle,Original Cost,Monthly Cost\n';
            for (var i = 0; i < subscriptions.length; i++) {
                var s = subscriptions[i];
                csv += '"' + s.name.replace(/"/g, '""') + '",' + s.cycle + ',' + s.originalCost.toFixed(2) + ',' + s.monthlyCost.toFixed(2) + '\n';
            }
            var monthly = subscriptions.reduce(function(a, b) { return a + (b.monthlyCost || 0); }, 0);
            csv += '\nSummary\n';
            csv += 'Monthly Total,' + monthly.toFixed(2) + '\n';
            csv += 'Yearly Total,' + (monthly * 12).toFixed(2) + '\n';
            csv += '5-Year Total,' + (monthly * 60).toFixed(2) + '\n';
            var blob = new Blob([csv], { type: 'text/csv' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'subscriptions-' + new Date().toISOString().slice(0,10) + '.csv';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Exported to CSV!');
        });
    }

    var quickAddBtns = document.querySelectorAll('.quick-add-btn');
    for (var i = 0; i < quickAddBtns.length; i++) {
        (function(btn) {
            btn.addEventListener('click', function() {
                var name = btn.getAttribute('data-name');
                var cost = parseFloat(btn.getAttribute('data-cost'));
                var cycle = btn.getAttribute('data-cycle') || 'monthly';
                var exists = false;
                for (var j = 0; j < subscriptions.length; j++) {
                    if (subscriptions[j].name.toLowerCase() === name.toLowerCase()) { exists = true; break; }
                }
                if (exists) { showToast(name + ' already added', 'error'); return; }
                subscriptions.push({
                    name: name, originalCost: cost, cycle: cycle, monthlyCost: toMonthly(cost, cycle)
                });
                saveSubscriptions();
                render();
                showToast(name + ' added!');
            });
        })(quickAddBtns[i]);
    }

    var faqItems = document.querySelectorAll('.faq-item');
    for (var i = 0; i < faqItems.length; i++) {
        (function(item) {
            var q = item.querySelector('.faq-question');
            q.addEventListener('click', function() {
                var isOpen = item.classList.contains('faq-open');
                for (var j = 0; j < faqItems.length; j++) faqItems[j].classList.remove('faq-open');
                if (!isOpen) item.classList.add('faq-open');
            });
        })(faqItems[i]);
    }

    if (addBtn) addBtn.addEventListener('click', openModal);
    render();
});
