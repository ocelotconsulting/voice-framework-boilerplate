const generateRandomBillAmount = () => {
  const min = Math.ceil(0)
  const max = Math.floor(500)
  const decimalMax = Math.floor(99)

  const dollars = Math.floor(Math.random() * (max - min + 1)) + min
  const cents = Math.floor(Math.random() * (decimalMax - min + 1)) + min

  return `$${dollars}.${cents}`
}

// replace this with an api call
const fetchBill = async () => ({ billAmount: generateRandomBillAmount() })

module.exports = { fetchBill, generateRandomBillAmount }
