import { getCountries, getCountryCallingCode } from "libphonenumber-js";

export interface CountryCallingCodeOption {
  iso2: string;
  name: string;
  callingCode: string;
  value: string;
}

const fallbackRegionName = (iso2: string): string => {
  if (iso2 === "XK") return "Kosovo";
  return iso2;
};

const displayNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

const unsortedOptions: CountryCallingCodeOption[] = getCountries().map((iso2) => {
  const callingCode = `+${getCountryCallingCode(iso2)}`;
  const localizedName = displayNames?.of(iso2);
  const name = (localizedName && localizedName !== iso2 ? localizedName : fallbackRegionName(iso2)).trim();

  return {
    iso2,
    name,
    callingCode,
    value: `${iso2}|${callingCode}`,
  };
});

export const COUNTRY_CALLING_CODE_OPTIONS = unsortedOptions.sort((left, right) =>
  left.name.localeCompare(right.name, "en", { sensitivity: "base" })
);

export const getOptionValueFromCallingCode = (callingCode?: string): string => {
  const normalized = (callingCode || "").trim();
  const byExactCode = COUNTRY_CALLING_CODE_OPTIONS.find((option) => option.callingCode === normalized);
  if (byExactCode) return byExactCode.value;

  const india = COUNTRY_CALLING_CODE_OPTIONS.find((option) => option.iso2 === "IN");
  return india?.value || COUNTRY_CALLING_CODE_OPTIONS[0]?.value || "IN|+91";
};

export const getCallingCodeFromOptionValue = (value?: string): string => {
  if (!value) return "+91";

  const parts = value.split("|");
  if (parts.length < 2) return "+91";

  const parsedCode = parts[1].trim();
  if (!/^\+\d{1,4}$/.test(parsedCode)) return "+91";
  return parsedCode;
};
