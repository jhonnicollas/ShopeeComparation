export const idPrefix = {
  user: "usr_",
  session: "ses_",
  researchSession: "rsr_",
  product: "prd_",
  shop: "shp_",
  comparison: "cmp_",
  comparisonItem: "cim_",
  job: "job_",
  jobLog: "log_",
  aiReport: "air_",
  rawSnapshot: "raw_",
  fieldEvidence: "evd_",
  productWeight: "wgt_",
  productFeature: "fea_",
  resolvedUrl: "url_",
  appConfig: "cfg_",
  aiProviderConfig: "aip_",
  aiModelConfig: "aim_",
  searchProviderConfig: "srp_",
  scoringConfig: "sco_",
} as const;

export type IdPrefix = (typeof idPrefix)[keyof typeof idPrefix];
