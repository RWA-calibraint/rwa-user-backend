export const constructSuccessResponse = (code, status, result) => {
  const response = {
    response_code: code,
    response_status: status,
    response: result,
  };
  return response;
};

export const constructFailureResponse = (code, error) => {
  const response = {
    response_code: code,
    response: null,
    response_error: error,
  };
  return response;
};

export const capitalizeFistLetter = (value: string) =>
  `${value.charAt(0)?.toUpperCase()}${value.slice(1)}`;

export const convertUsdToPol = async (usdAmount: number) => {
  let pol = 0;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd",
    );
    const data = await res.json();

    const price = data["matic-network"].usd;

    pol = price;
  } catch (error) {}

  if (!pol || pol <= 0) return 0;

  return parseFloat((usdAmount / pol).toFixed(2));
};
