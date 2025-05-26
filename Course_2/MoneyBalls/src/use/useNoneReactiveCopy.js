export function useNoneReactiveCopy(data) {
  return JSON.parse(JSON.stringify(data))
}
