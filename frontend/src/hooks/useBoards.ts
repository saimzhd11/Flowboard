'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { BoardSummary } from '@/types'

type AuthUser = {
  _id: string
} | null | undefined

export function useBoards(user: AuthUser) {
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [isBoardsLoading, setIsBoardsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setBoards([])
      setIsBoardsLoading(false)
      return
    }

    setIsBoardsLoading(true)

    api
      .get<BoardSummary[]>('/boards')
      .then(response => {
        setBoards(response.data)
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to load boards')
      })
      .finally(() => {
        setIsBoardsLoading(false)
      })
  }, [user])

  return {
    boards,
    setBoards,
    isBoardsLoading
  }
}