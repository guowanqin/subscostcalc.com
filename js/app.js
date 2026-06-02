document.addEventListener('DOMContentLoaded', function() {
    var subscriptions = [];
    var listEl = document.getElementById('subscriptions-list');
    var emptyEl = document.getElementById('empty-state');
    var resultsEl = document.getElementById('results-card');
    var addBtn = document.getElementById('add-btn');
    var monthlyEl = document.getElementById('monthly-total');
    var yearlyEl = document.getElementById('yearly-total');
    var fiveYearEl = document.getElementById('five-year-total');
    var insightEl = document.getElementById('insight-text');

    function addSubscription() {
        subscriptions.push({ name: '', price: 0 });
        render();
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
            div.className = 'sub-item';
            div.innerHTML = '<input type="text" placeholder="Service name (e.g. Netflix)" value="' + sub.name + '" oninput="updateSub(' + i + ', 'name', this.value)">' +
                '<input type="number" placeholder="Monthly $" step="0.01" min="0" value="' + sub.price + '" oninput="updateSub(' + i + ', 'price', parseFloat(this.value) || 0)">' +
                '<button class="btn btn-danger" onclick="removeSub(' + i + ')">Remove</button>';
            listEl.appendChild(div);
        }
        calculate();
    }

    window.updateSub = function(index, field, value) {
        subscriptions[index][field] = value;
        if (field === 'price') calculate();
    };

    window.removeSub = function(index) {
        subscriptions.splice(index, 1);
        render();
    };

    function calculate() {
        var monthly = 0;
        for (var i = 0; i < subscriptions.length; i++) {
            monthly += subscriptions[i].price || 0;
        }
        var yearly = monthly * 12;
        var fiveYear = yearly * 5;

        monthlyEl.textContent = '$' + monthly.toFixed(2);
        yearlyEl.textContent = '$' + yearly.toFixed(2);
        fiveYearEl.textContent = '$' + fiveYear.toFixed(2);

        if (monthly > 0) {
            var msgs = [];
            if (monthly < 50) msgs.push('Nice! You spend less than $50/mo on subscriptions.');
            else if (monthly < 150) msgs.push('Moderate subscription spending. Keep an eye on unused services.');
            else if (monthly < 300) msgs.push('At $' + monthly.toFixed(0) + '/mo, you're close to the average. Review each one.');
            else msgs.push('At $' + monthly.toFixed(0) + '/mo, you could save $' + (monthly - 150).toFixed(0) + '/mo by cutting unused subscriptions.');
            msgs.push('Over 5 years, that's <strong>$' + fiveYear.toFixed(0)</strong> total.');
            insightEl.innerHTML = msgs.join(' ');
        } else {
            insightEl.innerHTML = '';
        }
    }

    addBtn.addEventListener('click', addSubscription);
});
