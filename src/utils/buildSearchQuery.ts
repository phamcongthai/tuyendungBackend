export function buildNameSearchQuery(search: string) {
  if (!search) return {};
  const regex = { $regex: search, $options: 'i' };
  return {
    $or: [
      { fullName: regex },
      { email: regex },
      { phone: regex },
      { company: regex },
    ],
  };
}
