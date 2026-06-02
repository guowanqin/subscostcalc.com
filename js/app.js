window.quickAddService = function(name, cost, cycle, category) {
    try {
        var subs = JSON.parse(localStorage.getItem('subscostcalc_subs') || '[]');
        for (var i = 0; i < subs.length; i++) {
            if (subs[i].name.toLowerCase() === name.toLowerCase()) {
                alert(name + ' already added!');
                return;
            }
        }
        var monthly = cycle === 'yearly' ? cost / 12 : cost;
        subs.push({ name: name, originalCost: cost, cycle: cycle, monthlyCost: monthly, category: category });
        localStorage.setItem('subscostcalc_subs', JSON.stringify(subs));
        
        var listEl = document.getElementById('subscriptions-list');
        var emptyEl = document.getElementById('empty-state');
        if (emptyEl) emptyEl.style.display = 'none';
        
        var div = document.createElement('div');
        div.className = 'sub-card';
        var cycleText = cycle === 'yearly' ? 'Yearly: $' + cost.toFixed(2) + ' (~$' + monthly.toFixed(2) + '/mo)' : 'Monthly: $' + cost.toFixed(2);
        div.innerHTML = '<div class="sub-header"><span class="sub-name">' + name + '</span><span class="sub-cost">$' + monthly.toFixed(2) + '/mo</span></div><div class="sub-details">' + cycleText + '</div><div class="sub-actions"><button class="btn btn-outline" onclick="editSub(' + subs.length + '-1)">Edit</button><button class="btn btn-danger" onclick="removeSub(' + subs.length + '-1)">Remove</button></div>';
        listEl.appendChild(div);
        
        var totalMonthly = 0;
        for (var j = 0; j < subs.length; j++) totalMonthly += subs[j].monthlyCost;
        var monthlyEl = document.getElementById('monthly-total');
        var yearlyEl = document.getElementById('yearly-total');
        var fiveYearEl = document.getElementById('five-year-total');
        var insightEl = document.getElementById('insight-text');
        if (monthlyEl) monthlyEl.textContent = '$' + totalMonthly.toFixed(2);
        if (yearlyEl) yearlyEl.textContent = '$' + (totalMonthly * 12).toFixed(2);
        if (fiveYearEl) fiveYearEl.textContent = '$' + (totalMonthly * 12 * 5).toFixed(2);
        if (insightEl) insightEl.textContent = 'You spend $' + (totalMonthly * 12).toFixed(2) + ' per year on subscriptions!';
        
        var exportBtn = document.getElementById('export-btn');
        if (exportBtn) exportBtn.style.display = 'inline-block';
        
        alert(name + ' added! Monthly: $' + monthly.toFixed(2));
    } catch(e) {
        alert('Error: ' + e.message);
    }
};

(function() {
// Global quickAddService for inline onclick handlers
var STORAGE_KEY = 'subscostcalc_subs';
var subscriptions = loadSubscriptions();
var listEl = document.getElementById('subscriptions-list');
var emptyEl = document.getElementById('empty-state');
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
var quickAddSection = document.getElementById('quick-add-section');
var quickAddSearch = document.getElementById('quick-add-search');
var chartContainer = document.getElementById('chart-container');
var compareEl = document.getElementById('compare-el');
var savingsEl = document.getElementById('savings-el');
var categoryMap = {
'Streaming': 'streaming', 'Music': 'music', 'AI Tools': 'ai',
'Productivity': 'productivity', 'Cloud': 'cloud', 'News': 'news'
};
var reverseCategory = {};
for (var k in categoryMap) { reverseCategory[categoryMap[k]] = k; }
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
if (isNaN(cost) || cost <= 0 || cost > 10000) { showToast('Please enter a valid amount', 'error'); return; }
if (name.length > 50) { showToast('Name too long', 'error'); return; }
if (editId !== null) {
subscriptions[editId].name = name;
subscriptions[editId].originalCost = cost;
subscriptions[editId].cycle = cycle;
subscriptions[editId].monthlyCost = toMonthly(cost, cycle);
showToast('Subscription updated!');
} else {
subscriptions.push({
name: name, originalCost: cost, cycle: cycle,
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
function escHtml(str) {
var div = document.createElement('div');
div.appendChild(document.createTextNode(str));
return div.innerHTML;
}
window.editSub = function(id) { openEditModal(id); };
window.removeSub = function(id) { removeSub(id); };
window.swapSub = function(id) {
var sub = subscriptions[id];
editId = id;
modalTitle.textContent = 'Swap ' + sub.name;
modalName.value = sub.name;
modalCost.value = sub.originalCost;
modalCycle.value = sub.cycle;
modalOverlay.style.display = 'flex';
modalName.focus();
};
var examples = [
{ name: 'Netflix', cost: 22.99, cycle: 'monthly', category: 'streaming' },
{ name: 'Spotify', cost: 16.99, cycle: 'monthly', category: 'music' },
{ name: 'ChatGPT Plus', cost: 20.00, cycle: 'monthly', category: 'ai' },
{ name: 'YouTube Premium', cost: 13.99, cycle: 'monthly', category: 'streaming' },
{ name: 'Adobe Creative Cloud', cost: 599.88, cycle: 'yearly', category: 'ai' }
];
if (exampleBtn) {
exampleBtn.addEventListener('click', function() {
var demo = examples.map(function(e) {
return {
name: e.name, originalCost: e.cost, cycle: e.cycle,
monthlyCost: toMonthly(e.cost, e.cycle), category: e.category
};
});
subscriptions = demo;
saveSubscriptions();
listEl.innerHTML = '';
emptyEl.style.display = 'none';
if (quickAddSection) quickAddSection.style.display = 'none';
buildCards();
calculate();
showToast('Example subscriptions loaded!');
});
}
function buildCards() {
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
'<button class="btn-swap" onclick="swapSub(' + i + ')" title="Swap">&#x21bb;</button>' +
'</div>';
listEl.appendChild(div);
}
}
function render() {
listEl.innerHTML = '';
if (subscriptions.length === 0) {
emptyEl.style.display = 'block';
if (quickAddSection) quickAddSection.style.display = 'block';
if (compareEl) compareEl.style.display = 'none';
if (chartContainer) chartContainer.style.display = 'none';
if (savingsEl) savingsEl.style.display = 'none';
if (exportBtn) exportBtn.style.display = 'none';
return;
}
emptyEl.style.display = 'none';
if (quickAddSection) quickAddSection.style.display = 'none';
if (exportBtn) exportBtn.style.display = '';
buildCards();
calculate();
}
function calculate() {
var monthly = 0;
var catTotals = {};
for (var k in categoryMap) { catTotals[k] = 0; }
for (var i = 0; i < subscriptions.length; i++) {
var sub = subscriptions[i];
monthly += sub.monthlyCost || 0;
var cat = sub.category || 'Streaming';
if (catTotals[cat] === undefined) {
catTotals['Other'] = (catTotals['Other'] || 0) + sub.monthlyCost;
} else {
catTotals[cat] += sub.monthlyCost;
}
}
var yearly = monthly * 12;
var fiveYear = yearly * 5;
monthlyEl.textContent = '$' + monthly.toFixed(2);
yearlyEl.textContent = '$' + yearly.toFixed(2);
fiveYearEl.textContent = '$' + fiveYear.toFixed(2);
// Insight text
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
// Compare with average $219
if (compareEl && monthly > 0) {
var diff = monthly - 219;
var pct = Math.round(Math.abs(diff) / 219 * 100);
if (diff < 0) {
compareEl.innerHTML = 'You spend <span class="amount">$' + Math.abs(diff).toFixed(0) + ' less</span> per month than the average ($219). <span class="amount">-' + pct + '%</span>. Great job!';
} else {
compareEl.innerHTML = 'You spend <span class="amount">$' + diff.toFixed(0) + ' more</span> per month than average ($219). <span class="amount">+' + pct + '%</span>. Review subscriptions?';
}
compareEl.style.display = 'block';
}
// Category chart
if (chartContainer && subscriptions.length > 1) {
var html = '<h4>Spending by Category</h4>';
var sorted = [];
for (var k in catTotals) {
if (catTotals[k] > 0) sorted.push({cat: k, total: catTotals[k]});
}
sorted.sort(function(a,b) { return b.total - a.total; });
var maxVal = sorted.length > 0 ? sorted[0].total : 1;
for (var i = 0; i < sorted.length; i++) {
var s = sorted[i];
var barPct = Math.round(s.total / maxVal * 100);
var subPct = monthly > 0 ? Math.round(s.total / monthly * 100) : 0;
var catClass = categoryMap[s.cat] || 'productivity';
html += '<div class="chart-bar-row">' +
'<span class="chart-bar-label">' + s.cat + '</span>' +
'<div class="chart-bar"><div class="chart-bar-fill ' + catClass + '" style="width:' + barPct + '%"></div></div>' +
'<span class="chart-bar-value">$' + s.total.toFixed(0) + '/' + subPct + '%</span>' +
'</div>';
}
chartContainer.innerHTML = html;
chartContainer.style.display = 'block';
}
// Savings tip
if (savingsEl) {
var tip = '';
if (monthly > 200) {
tip = '💡 Tip: Cancel 2 unused subscriptions to save ~$30/mo. Over 5 years that's <strong>$1,800</strong>!';
} else if (monthly > 100) {
tip = '💡 Tip: Consider yearly billing for services you use daily. Most save 15-20%.';
} else {
tip = '✅ You're below average! Keep monitoring for unused subscriptions.';
}
savingsEl.innerHTML = tip;
savingsEl.style.display = 'block';
}
}
// Quick Add event delegation
if (quickAddSection) {
quickAddSection.addEventListener('click', function(e) {
var btn = e.target.closest('.quick-add-btn');
if (!btn) return;
e.preventDefault();
e.stopPropagation();
var name = btn.getAttribute('data-name');
var cost = parseFloat(btn.getAttribute('data-cost'));
var cycle = btn.getAttribute('data-cycle') || 'monthly';
var category = btn.getAttribute('data-category') || 'Streaming';
var exists = false;
for (var j = 0; j < subscriptions.length; j++) {
if (subscriptions[j].name.toLowerCase() === name.toLowerCase()) { exists = true; break; }
}
if (exists) { showToast(name + ' already added', 'error'); return; }
subscriptions.push({
name: name, originalCost: cost, cycle: cycle,
monthlyCost: toMonthly(cost, cycle), category: category
});
saveSubscriptions();
render();
showToast(name + ' added!');
});
}
// Search filter
if (quickAddSearch) {
quickAddSearch.addEventListener('input', function() {
var query = this.value.toLowerCase().trim();
var btns = quickAddSection.querySelectorAll('.quick-add-btn');
for (var i = 0; i < btns.length; i++) {
var name = btns[i].getAttribute('data-name').toLowerCase();
btns[i].style.display = (!query || name.indexOf(query) !== -1) ? '' : 'none';
}
});
}
// Tab filter
var tabBtns = quickAddSection ? quickAddSection.querySelectorAll('.tab-btn') : [];
var currentTab = 'all';
for (var t = 0; t < tabBtns.length; t++) {
(function(tab) {
tab.addEventListener('click', function() {
var tabName = this.getAttribute('data-tab');
currentTab = tabName;
for (var i = 0; i < tabBtns.length; i++) tabBtns[i].classList.remove('active');
this.classList.add('active');
var btns = quickAddSection.querySelectorAll('.quick-add-btn');
for (var i = 0; i < btns.length; i++) {
var cat = btns[i].getAttribute('data-category') || '';
btns[i].style.display = (tabName === 'all' || cat === tabName) ? '' : 'none';
}
});
})(tabBtns[t]);
}
// FAQ toggle
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
})();
