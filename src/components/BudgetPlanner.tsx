import React, { useEffect, useMemo, useState } from "react";

/**
 * Budget Planner – Redesigned for better UX
 *
 * Features
 * - Fixed income categories with custom options
 * - Fixed expense categories with subcategories and custom entries
 * - Improved visual design and user experience
 * - Auto-save to localStorage
 * - PDF export functionality
 * - Rent ratio analysis and warnings
 */

// ---------- Types ----------
interface IncomeItem {
  id: string;
  category: string;
  amount: number;
  isCustom: boolean;
}

interface ExpenseItem {
  id: string;
  category: string;
  subcategory: string;
  amount: number;
  isCustom: boolean;
}

interface BudgetData {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
}

// Fixed income categories
const INCOME_CATEGORIES = [
  "SU",
  "Løn (deltid)",
  "Løn (fuldtid)",
  "Stipendium",
  "Forældrebidrag",
  "Anden indtægt"
];

// Fixed expense categories with subcategories
const EXPENSE_CATEGORIES = {
  "Bolig": ["Husleje", "El", "Varme", "Vand", "Internet", "Forsikring", "Anden boligudgift"],
  "Transport": ["Offentlig transport", "Bil (benzin)", "Bil (forsikring)", "Cykel", "Anden transport"],
  "Mad": ["Dagligvarer", "Takeaway", "Restaurant", "Kaffe/snacks", "Anden mad"],
  "Uddannelse": ["Bøger", "Udstyr", "Kursusgebyrer", "Anden uddannelse"],
  "Sundhed": ["Læge", "Tandlæge", "Medicin", "Fitness", "Anden sundhed"],
  "Fritid": ["Sport", "Hobby", "Streaming", "Gaming", "Bio/events", "Anden fritid"],
  "Tøj": ["Hverdagstøj", "Sko", "Vintertøj", "Andet tøj"],
  "Økonomi": ["Opsparing", "Pension", "Investering", "Anden økonomi"],
  "Øvrigt": ["Gaver", "Frisør", "Mobil", "Andet"]
};

const DKK = new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 });

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_DATA: BudgetData = {
  incomes: [
    { id: uid(), category: "SU", amount: 6500, isCustom: false },
  ],
  expenses: [
    { id: uid(), category: "Bolig", subcategory: "Husleje", amount: 4000, isCustom: false },
    { id: uid(), category: "Bolig", subcategory: "El", amount: 300, isCustom: false },
    { id: uid(), category: "Bolig", subcategory: "Varme", amount: 200, isCustom: false },
    { id: uid(), category: "Bolig", subcategory: "Vand", amount: 100, isCustom: false },
    { id: uid(), category: "Mad", subcategory: "Dagligvarer", amount: 1800, isCustom: false },
    { id: uid(), category: "Transport", subcategory: "Offentlig transport", amount: 350, isCustom: false },
    { id: uid(), category: "Fritid", subcategory: "Streaming", amount: 150, isCustom: false },
    { id: uid(), category: "Økonomi", subcategory: "Opsparing", amount: 500, isCustom: false },
  ],
};

const STORAGE_KEY = "budget_planner_v2";

export default function BudgetPlanner() {
  const [data, setData] = useState<BudgetData>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : DEFAULT_DATA;
  });

  const totalIncome = useMemo(() => data.incomes.reduce((s, r) => s + (Number(r.amount) || 0), 0), [data]);
  const totalExpenses = useMemo(() => data.expenses.reduce((s, r) => s + (Number(r.amount) || 0), 0), [data]);
  const net = totalIncome - totalExpenses;

  const rentItem = data.expenses.find(e => e.subcategory === "Husleje");
  const rent = rentItem ? rentItem.amount : 0;
  const rentRatio = totalIncome > 0 ? rent / totalIncome : 0;

  // Risk band for rent burden
  const rentBand: "green" | "yellow" | "red" = rentRatio <= 0.35 ? "green" : rentRatio <= 0.45 ? "yellow" : "red";

  // Category aggregation for expenses breakdown
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    data.expenses.forEach(e => {
      const current = map.get(e.category) || 0;
      map.set(e.category, current + (Number(e.amount) || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [data.expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  function updateIncome(id: string, amount: number) {
    setData(prev => ({
      ...prev,
      incomes: prev.incomes.map(item => item.id === id ? { ...item, amount } : item)
    }));
  }

  function updateExpense(id: string, amount: number) {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(item => item.id === id ? { ...item, amount } : item)
    }));
  }

  function addIncome(category: string) {
    const newIncome: IncomeItem = {
      id: uid(),
      category,
      amount: 0,
      isCustom: category === "Anden indtægt"
    };
    setData(prev => ({ ...prev, incomes: [...prev.incomes, newIncome] }));
  }

  function addExpense(category: string, subcategory: string) {
    const newExpense: ExpenseItem = {
      id: uid(),
      category,
      subcategory,
      amount: 0,
      isCustom: subcategory.includes("Anden") || subcategory.includes("Andet")
    };
    setData(prev => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
  }

  function removeIncome(id: string) {
    setData(prev => ({ ...prev, incomes: prev.incomes.filter(item => item.id !== id) }));
  }

  function removeExpense(id: string) {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(item => item.id !== id) }));
  }

  function resetToDefaults() {
    if (!confirm("Nulstil budget til standard værdier?")) return;
    setData(DEFAULT_DATA);
  }

  function printPDF() {
    window.print();
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Modern Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
          Din Budgetplan
        </h1>
        <p className="text-slate-600 mb-6">Få styr på dine penge og planlæg din fremtid</p>
        <div className="flex justify-center gap-3">
          <button 
            onClick={resetToDefaults} 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-all"
          >
            🔄 Nulstil
          </button>
          <button 
            onClick={printPDF} 
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full text-sm font-medium transition-all shadow-lg"
          >
            📄 Eksporter PDF
          </button>
        </div>
      </div>

      {/* Hero Stats Dashboard */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Income */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{DKK.format(totalIncome)}</div>
            <div className="text-sm text-slate-600">Månedlige indtægter</div>
          </div>

          {/* Net Result */}
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              net >= 0 ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-red-400 to-red-500'
            }`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={net >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
            </div>
            <div className={`text-3xl font-bold mb-1 ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {DKK.format(net)}
            </div>
            <div className="text-sm text-slate-600">
              {net >= 0 ? 'Månedligt overskud' : 'Månedligt underskud'}
            </div>
          </div>

          {/* Expenses */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">{DKK.format(totalExpenses)}</div>
            <div className="text-sm text-slate-600">Månedlige udgifter</div>
          </div>
        </div>

        {/* Rent Ratio Alert */}
        {rent > 0 && (
          <div className="mt-8 text-center">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${
              rentBand === "green" ? "bg-green-100 text-green-800" : 
              rentBand === "yellow" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
            }`}>
              <div className="text-2xl">🏠</div>
              <div>
                <div className="font-semibold">
                  Din husleje udgør {(rentRatio * 100).toFixed(0)}% af din indtægt
                </div>
                <div className="text-sm opacity-80">
                  {rentBand === "green" ? "Sundt niveau - godt arbejde!" : 
                   rentBand === "yellow" ? "Lidt højt - vær forsigtig med andre udgifter" : 
                   "For højt - overvej dine muligheder"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Budget Editor */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ModernIncomeEditor 
          incomes={data.incomes}
          onUpdate={updateIncome}
          onAdd={addIncome}
          onRemove={removeIncome}
        />
        
        <ModernExpenseEditor 
          expenses={data.expenses}
          onUpdate={updateExpense}
          onAdd={addExpense}
          onRemove={removeExpense}
        />
      </div>

      {/* Insights & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ModernExpenseBreakdown categoryTotals={categoryTotals} totalExpenses={totalExpenses} />
        <BudgetInsights net={net} rentRatio={rentRatio} rentBand={rentBand} />
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------

function SummaryCard({ title, amount, type }: { title: string; amount: number; type: "income" | "expense" | "positive" | "negative" }) {
  const bgColor = type === "income" ? "bg-green-50 border-green-200" : 
                  type === "expense" ? "bg-red-50 border-red-200" : 
                  type === "positive" ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200";
  
  const textColor = type === "income" ? "text-green-800" : 
                   type === "expense" ? "text-red-800" : 
                   type === "positive" ? "text-blue-800" : "text-red-800";

  return (
    <div className={`${bgColor} border rounded-2xl p-6`}>
      <div className="text-sm text-slate-600 mb-2">{title}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{DKK.format(amount)}</div>
    </div>
  );
}

function ModernIncomeEditor({ 
  incomes, 
  onUpdate, 
  onAdd, 
  onRemove 
}: { 
  incomes: IncomeItem[];
  onUpdate: (id: string, amount: number) => void;
  onAdd: (category: string) => void;
  onRemove: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleAdd = () => {
    if (selectedCategory) {
      onAdd(selectedCategory);
      setSelectedCategory("");
      setShowAddForm(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Indtægter</h2>
              <p className="text-green-100">Tilføj alle dine månedlige indtægter</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-medium transition-all"
          >
            + Ny indtægt
          </button>
        </div>
      </div>

      <div className="p-6">
        {showAddForm && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <label className="block text-sm font-medium text-slate-700 mb-2">Vælg indtægtstype</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-xl mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">-- Vælg type --</option>
              {INCOME_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button 
                onClick={handleAdd} 
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all"
              >
                Tilføj indtægt
              </button>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="px-4 py-2 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition-all"
              >
                Annuller
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {incomes.map((income) => (
            <div key={income.id} className="group bg-slate-50 hover:bg-green-50 rounded-2xl p-4 transition-all border border-transparent hover:border-green-200">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{income.category}</div>
                  <div className="text-sm text-slate-500">Månedlig indtægt</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={income.amount || ""}
                      onChange={(e) => onUpdate(income.id, Number(e.target.value) || 0)}
                      className="w-32 px-4 py-2 text-right border border-slate-300 rounded-xl font-semibold text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 pointer-events-none">kr</span>
                  </div>
                  <button 
                    onClick={() => onRemove(income.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                    title="Fjern indtægt"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {incomes.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-3xl flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Ingen indtægter endnu</p>
              <p className="text-sm">Klik på "Ny indtægt" for at komme i gang</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModernExpenseEditor({ 
  expenses, 
  onUpdate, 
  onAdd, 
  onRemove 
}: { 
  expenses: ExpenseItem[];
  onUpdate: (id: string, amount: number) => void;
  onAdd: (category: string, subcategory: string) => void;
  onRemove: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const handleAdd = () => {
    if (selectedCategory && selectedSubcategory) {
      onAdd(selectedCategory, selectedSubcategory);
      setSelectedCategory("");
      setSelectedSubcategory("");
      setShowAddForm(false);
    }
  };

  const groupedExpenses = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) acc[expense.category] = [];
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, ExpenseItem[]>);

  const categoryIcons: Record<string, string> = {
    "Bolig": "🏠",
    "Transport": "🚌",
    "Mad": "🍽️",
    "Uddannelse": "📚",
    "Sundhed": "💊",
    "Fritid": "🎮",
    "Tøj": "👕",
    "Økonomi": "💰",
    "Øvrigt": "📦"
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Udgifter</h2>
              <p className="text-red-100">Organiser dine månedlige udgifter</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-medium transition-all"
          >
            + Ny udgift
          </button>
        </div>
      </div>

      <div className="p-6">
        {showAddForm && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("");
                  }}
                  className="w-full p-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">-- Vælg kategori --</option>
                  {Object.keys(EXPENSE_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{categoryIcons[cat]} {cat}</option>
                  ))}
                </select>
              </div>
              
              {selectedCategory && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Underkategori</label>
                  <select 
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full p-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">-- Vælg type --</option>
                    {EXPENSE_CATEGORIES[selectedCategory as keyof typeof EXPENSE_CATEGORIES]?.map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleAdd} 
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all"
              >
                Tilføj udgift
              </button>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="px-4 py-2 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition-all"
              >
                Annuller
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(groupedExpenses).map(([category, categoryExpenses]) => (
            <div key={category} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-xl">{categoryIcons[category]}</span>
                <span>{category}</span>
                <span className="text-sm text-slate-500 font-normal">({categoryExpenses.length} poster)</span>
              </h3>
              <div className="space-y-2">
                {categoryExpenses.map((expense) => (
                  <div key={expense.id} className="group bg-white hover:bg-red-50 rounded-xl p-3 transition-all border border-transparent hover:border-red-200">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{expense.subcategory}</div>
                        <div className="text-sm text-slate-500">Månedlig udgift</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={expense.amount || ""}
                            onChange={(e) => onUpdate(expense.id, Number(e.target.value) || 0)}
                            className="w-32 px-4 py-2 text-right border border-slate-300 rounded-xl font-semibold text-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-2 text-slate-500 pointer-events-none">kr</span>
                        </div>
                        <button 
                          onClick={() => onRemove(expense.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                          title="Fjern udgift"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {expenses.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-3xl flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Ingen udgifter endnu</p>
              <p className="text-sm">Klik på "Ny udgift" for at komme i gang</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModernExpenseBreakdown({ categoryTotals, totalExpenses }: { categoryTotals: [string, number][]; totalExpenses: number }) {
  const categoryIcons: Record<string, string> = {
    "Bolig": "🏠",
    "Transport": "🚌", 
    "Mad": "🍽️",
    "Uddannelse": "📚",
    "Sundhed": "💊",
    "Fritid": "🎮",
    "Tøj": "👕",
    "Økonomi": "💰",
    "Øvrigt": "📦"
  };

  const colors = [
    "from-blue-400 to-blue-600", "from-green-400 to-green-600", "from-purple-400 to-purple-600", 
    "from-red-400 to-red-600", "from-yellow-400 to-yellow-600", "from-indigo-400 to-indigo-600", 
    "from-pink-400 to-pink-600", "from-teal-400 to-teal-600", "from-orange-400 to-orange-600"
  ];

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Udgiftsfordeling</h3>
          <p className="text-slate-600">Se hvor dine penge går hen</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {categoryTotals.map(([category, amount], index) => {
          const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          const gradientClass = colors[index % colors.length];
          return (
            <div key={category} className="group">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcons[category]}</span>
                  <span className="font-semibold text-slate-900">{category}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{DKK.format(amount)}</div>
                  <div className="text-sm text-slate-500">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`bg-gradient-to-r ${gradientClass} h-3 rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {categoryTotals.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-3xl flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Ingen udgifter at vise</p>
            <p className="text-sm">Tilføj nogle udgifter for at se fordelingen</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetInsights({ net, rentRatio, rentBand }: { net: number; rentRatio: number; rentBand: "green" | "yellow" | "red" }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Smart Anbefalinger</h3>
          <p className="text-slate-600">Personlige råd til dit budget</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Net income insight */}
        <div className={`p-4 rounded-2xl border-2 ${
          net >= 1500 ? 'bg-green-50 border-green-200 text-green-800' :
          net >= 500 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          net >= 0 ? 'bg-orange-50 border-orange-200 text-orange-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              {net >= 1500 ? '🎉' : net >= 500 ? '👍' : net >= 0 ? '⚠️' : '🚨'}
            </div>
            <div>
              <div className="font-bold mb-1">
                {net >= 1500 ? 'Fantastisk økonomi!' :
                 net >= 500 ? 'God økonomi' :
                 net >= 0 ? 'Stram økonomi' :
                 'Økonomisk udfordring'}
              </div>
              <div className="text-sm">
                {net >= 1500 ? 'Du har rigtig god råd og kan spare op til fremtiden.' :
                 net >= 500 ? 'Du har et sundt budget med plads til opsparing.' :
                 net >= 0 ? 'Dit budget er stramt. Prøv at finde områder at spare på.' :
                 'Du bruger mere end du tjener. Det er vigtigt at justere dit budget nu.'}
              </div>
            </div>
          </div>
        </div>

        {/* Rent ratio insight */}
        <div className={`p-4 rounded-2xl border-2 ${
          rentBand === "green" ? 'bg-green-50 border-green-200 text-green-800' :
          rentBand === "yellow" ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className="text-2xl">🏠</div>
            <div>
              <div className="font-bold mb-1">
                Huslejebyrde: {(rentRatio * 100).toFixed(0)}%
              </div>
              <div className="text-sm">
                {rentBand === "green" ? 'Perfekt! Din husleje er på et sundt niveau under 35%.' :
                 rentBand === "yellow" ? 'Din husleje er lidt høj. Prøv at holde den under 35% hvis muligt.' :
                 'Din husleje er for høj. Overvej billigere bolig eller øget indtægt.'}
              </div>
            </div>
          </div>
        </div>

        {/* General tips */}
        <div className="p-4 bg-blue-50 border-2 border-blue-200 text-blue-800 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-bold mb-1">Budgettip</div>
              <div className="text-sm">
                Husk at budgettere 10-15% til uforudsete udgifter og mindst 10% til opsparing hvis muligt.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Dine data gemmes kun lokalt i din browser og deles ikke.</span>
          </div>
        </div>
      </div>
    </div>
  );
}