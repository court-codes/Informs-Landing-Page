export function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[head] = setIn(obj?.[head], rest, value);
  return copy;
}

export function moveItem(list, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

export function updateItem(list, index, patch) {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function removeItem(list, index) {
  return list.filter((_, i) => i !== index);
}
