import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Transaction {
    id: string
    description: string
    date: string
    type: 'income' | 'expense'
    amount: number
    category_id?: string
    payment_method_id?: string
    note?: string
}

interface TransactionStore {
    transactions: Transaction[]
    pendingSync: Transaction[]
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void
    updateTransaction: (id: string, transaction: Partial<Transaction>) => void
    deleteTransaction: (id: string) => void
    setTransactions: (transactions: Transaction[]) => void
    syncPending: () => Promise<void>
}

export const useTransactionStore = create<TransactionStore>()(
    persist(
        (set, get) => ({
            transactions: [],
            pendingSync: [],

            addTransaction: (transaction) => {
                const newTransaction = {
                    id: crypto.randomUUID(),
                    ...transaction
                }
                set((state) => ({
                    transactions: [newTransaction, ...state.transactions],
                    pendingSync: [...state.pendingSync, newTransaction]
                }))
            },

            updateTransaction: (id, updates) => {
                set((state) => ({
                    transactions: state.transactions.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    )
                }))
            },

            deleteTransaction: (id) => {
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id)
                }))
            },

            setTransactions: (transactions) => {
                set({ transactions })
            },

            syncPending: async () => {
                // Supabase에 동기화 로직은 추후 구현
                const pending = get().pendingSync
                if (pending.length === 0) return

                // 동기화 시도 및 성공 후 처리...
                set({ pendingSync: [] })
            }
        }),
        {
            name: 'transaction-storage',
            partialize: (state) => ({ transactions: state.transactions })
        }
    )
)
