type EmptyBoardsStateProps = {
  onCreate: () => void
}

export default function EmptyBoardsState({ onCreate }: EmptyBoardsStateProps) {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-dark-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
        </svg>
      </div>

      <p className="text-slate-400 font-medium">No boards yet</p>
      <p className="text-slate-600 text-sm mt-1 mb-4">
        Create your first board to get started
      </p>

      <button onClick={onCreate} className="btn-primary">
        Create board
      </button>
    </div>
  )
}