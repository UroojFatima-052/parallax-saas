function SubmitButton({ children, loading = false }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 h-11 w-full rounded-lg bg-rose text-sm font-semibold text-white transition hover:bg-rose-dark focus:outline-none focus:ring-4 focus:ring-rose/20 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}

export default SubmitButton