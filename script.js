document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element References ---
  const totalBalanceEl = document.getElementById('totalBalance');
  const totalIncomeEl = document.getElementById('totalIncome');
  const totalExpensesEl = document.getElementById('totalExpenses');
  const transactionListEl = document.getElementById('transactionList');
  const emptyStateContainer = document.getElementById('empty-state-container');

  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const transactionModal = document.getElementById('transactionModal');
  const transactionForm = document.getElementById('transactionForm');
  const modalTitle = document.getElementById('modalTitle');

  const confirmModal = document.getElementById('confirmModal');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalText = document.getElementById('confirmModalText');
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');

  const clearAllBtn = document.getElementById('clearAllBtn');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  // --- Chart References ---
  let categoryPieChart;
  let incomeVsExpenseChart;

  // --- State Management ---
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

  // --- Utility Functions ---
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });

  // --- Main Render Function ---
  const render = () => {
    updateDashboard();
    renderTransactionList();
    renderCharts();
  };

  // --- Animated Number Counter ---
  const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = progress * (end - start) + start;
      element.textContent = formatCurrency(currentValue);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  // --- Dashboard Update ---
  const updateDashboard = () => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;

    const getNumericValue = (el) =>
      parseFloat(el.textContent.replace(/[^0-9.-]+/g, '')) || 0;

    animateValue(totalBalanceEl, getNumericValue(totalBalanceEl), balance, 500);
    animateValue(totalIncomeEl, getNumericValue(totalIncomeEl), income, 500);
    animateValue(
      totalExpensesEl,
      getNumericValue(totalExpensesEl),
      expenses,
      500
    );
  };

  // --- Transaction List Rendering ---
  const renderTransactionList = () => {
    transactionListEl.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    const sortValue = sortSelect.value;

    let filteredTransactions = transactions.filter(
      (t) =>
        (t.title ?? '').toLowerCase().includes(searchTerm) ||
    (t.category ?? '').toLowerCase().includes(searchTerm)
    );
    filteredTransactions.sort((a, b) => {
      switch (sortValue) {
        case 'date_asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    if (transactions.length === 0) {
      emptyStateContainer.classList.remove('hidden');
    } else {
      emptyStateContainer.classList.add('hidden');
      if (filteredTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="text-center py-10 text-gray-500">No transactions match your search.</td>`;
        transactionListEl.appendChild(row);
      } else {
        filteredTransactions.forEach((transaction) => {
          const row = createTransactionRow(transaction);
          transactionListEl.appendChild(row);
        });
      }
    }
  };

  const createTransactionRow = (transaction) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    row.dataset.id = transaction.id;
    const amountColor =
      transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
    const amountSign = transaction.type === 'income' ? '+' : '-';
    row.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-semibold text-gray-900">${
      transaction.title
    }</div><div class="text-xs text-gray-500">${
transaction.category
}</div></td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(
      transaction.date
    )}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${amountColor}">${amountSign} ${formatCurrency(
transaction.amount
)}</td>
    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg></button>
        <button class="delete-btn text-red-600 hover:text-red-900 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
    </td>`;
    return row;
  };

  // --- Chart Rendering ---
  const renderCharts = () => {
    renderCategoryPieChart();
    renderIncomeVsExpenseChart();
  };

  const createEmptyChartState = (container, message) => {
    container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center text-gray-500">
    <svg class="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-1.5m-6-3.75h.008v.008H9v-.008zm4.5 0h.008v.008h-.008v-.008zm2.25 0h.008v.008h-.008v-.008zM3.75 21h16.5M3.75 21v-1.5m16.5 1.5v-1.5" /></svg>
    <p class="mt-2 text-sm">${message}</p>
</div>`;
  };

  const renderCategoryPieChart = () => {
    const container = document.getElementById('categoryChartContainer');
    if (categoryPieChart) categoryPieChart.destroy();

    const expenseData = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    if (Object.keys(expenseData).length === 0) {
      createEmptyChartState(container, 'No expense data to display.');
      return;
    }
    container.innerHTML = '<canvas id="categoryPieChart"></canvas>';
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    categoryPieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(expenseData),
        datasets: [
          {
            data: Object.values(expenseData),
            backgroundColor: [
              '#4f46e5',
              '#10b981',
              '#ef4444',
              '#f97316',
              '#3b82f6',
              '#8b5cf6',
              '#ec4899',
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter' } } },
        },
      },
    });
  };

  const renderIncomeVsExpenseChart = () => {
    const container = document.getElementById('trendChartContainer');
    if (incomeVsExpenseChart) incomeVsExpenseChart.destroy();

    const monthlyData = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });
      if (!acc[month]) acc[month] = { income: 0, expense: 0 };
      acc[month][t.type] += t.amount;
      return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort(
      (a, b) => new Date(`01 ${a}`) - new Date(`01 ${b}`)
    );
    if (sortedMonths.length === 0) {
      createEmptyChartState(container, 'No data for trend analysis.');
      return;
    }
    container.innerHTML = '<canvas id="incomeVsExpenseChart"></canvas>';
    const ctx = document
      .getElementById('incomeVsExpenseChart')
      .getContext('2d');
    incomeVsExpenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedMonths,
        datasets: [
          {
            label: 'Income',
            data: sortedMonths.map((m) => monthlyData[m].income),
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(5, 150, 105, 1)',
            borderWidth: 1,
          },
          {
            label: 'Expense',
            data: sortedMonths.map((m) => monthlyData[m].expense),
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(220, 38, 38, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => formatCurrency(v) },
          },
        },
        plugins: { legend: { position: 'top' } },
      },
    });
  };

  // --- Modal Handling ---
  const openModal = (modalEl) => {
    modalEl.classList.remove('modal-hidden', 'pointer-events-none');
  };
  const closeModal = (modalEl) => {
    modalEl.classList.add('modal-hidden');
    setTimeout(() => modalEl.classList.add('pointer-events-none'), 300);
  };

  const openTransactionModal = (transaction = null) => {
    transactionForm.reset();
    if (transaction) {
      modalTitle.textContent = 'Edit Transaction';
      transactionForm.querySelector('button[type="submit"]').textContent =
        'Save Changes';
      document.getElementById('transactionId').value = transaction.id;
      document.getElementById('title').value = transaction.title;
      document.getElementById('amount').value = transaction.amount;
      document.querySelector(
        `input[name="type"][value="${transaction.type}"]`
      ).checked = true;
      document.getElementById('category').value = transaction.category;
      document.getElementById('date').value = transaction.date;
    } else {
      modalTitle.textContent = 'Add Transaction';
      transactionForm.querySelector('button[type="submit"]').textContent =
        'Add Transaction';
      document.getElementById('transactionId').value = '';
      document.getElementById('date').valueAsDate = new Date();
    }
    openModal(transactionModal);
  };

  // --- Confirmation Modal Logic ---
  const openConfirmModal = (config) => {
    confirmModalTitle.textContent = config.title;
    confirmModalText.textContent = config.text;
    openModal(confirmModal);

    // Get the button from the DOM each time to avoid stale references from node replacement
    let confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);

    newConfirmBtn.addEventListener(
      'click',
      () => {
        config.onConfirm();
        closeModal(confirmModal);
      },
      { once: true }
    );
  };

  // --- Data Persistence ---
  const saveTransactions = () =>
    localStorage.setItem('transactions', JSON.stringify(transactions));

  // --- Event Handlers ---
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('transactionId').value;
    const newTransaction = {
      title: document.getElementById('title').value,
      amount: parseFloat(document.getElementById('amount').value),
      type: document.querySelector('input[name="type"]:checked').value,
      category: document.getElementById('category').value,
      date: document.getElementById('date').value,
    };

    if (id) {
      const index = transactions.findIndex((t) => t.id == id);
      transactions[index] = { ...transactions[index], ...newTransaction };
    } else {
      newTransaction.id = Date.now();
      transactions.push(newTransaction);
    }
    saveTransactions();
    render();
    closeModal(transactionModal);
  };

  const handleListClick = (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    if (editBtn) {
      const row = editBtn.closest('tr');
      const transaction = transactions.find((t) => t.id == row.dataset.id);
      openTransactionModal(transaction);
    }
    if (deleteBtn) {
      const row = deleteBtn.closest('tr');
      const id = row.dataset.id;
      openConfirmModal({
        title: 'Delete Transaction',
        text: 'Are you sure you want to delete this transaction? This action cannot be undone.',
        onConfirm: () => {
          row.classList.add('row-deleting');
          setTimeout(() => {
            transactions = transactions.filter((t) => t.id != id);
            saveTransactions();
            render();
          }, 300);
        },
      });
    }
  };

  const handleClearAll = () => {
    openConfirmModal({
      title: 'Clear All Data',
      text: 'Are you sure you want to delete ALL transactions? This is permanent.',
      onConfirm: () => {
        transactions = [];
        saveTransactions();
        render();
      },
    });
  };

  // --- Initial Setup & Event Listeners ---
  const init = () => {
    if (localStorage.getItem('transactions') === null) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      transactions = [
        {
          id: 1,
          title: 'Monthly Salary',
          amount: 3500,
          type: 'income',
          category: 'Salary',
          date: today.toISOString().split('T')[0],
        },
        {
          id: 2,
          title: 'Groceries',
          amount: 150.75,
          type: 'expense',
          category: 'Food',
          date: today.toISOString().split('T')[0],
        },
        {
          id: 3,
          title: 'Internet Bill',
          amount: 60,
          type: 'expense',
          category: 'Bills',
          date: yesterday.toISOString().split('T')[0],
        },
        {
          id: 4,
          title: 'New T-shirt',
          amount: 25.5,
          type: 'expense',
          category: 'Shopping',
          date: twoDaysAgo.toISOString().split('T')[0],
        },
      ];
      saveTransactions();
    }

    openModalBtn.addEventListener('click', () => openTransactionModal());
    closeModalBtn.addEventListener('click', () => closeModal(transactionModal));
    transactionModal.addEventListener('click', (e) => {
      if (e.target === transactionModal) closeModal(transactionModal);
    });

    cancelConfirmBtn.addEventListener('click', () => closeModal(confirmModal));
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeModal(confirmModal);
    });

    transactionForm.addEventListener('submit', handleFormSubmit);
    transactionListEl.addEventListener('click', handleListClick);
    searchInput.addEventListener('input', renderTransactionList);
    sortSelect.addEventListener('change', renderTransactionList);
    clearAllBtn.addEventListener('click', handleClearAll);

    render();
  };

  init();
});
