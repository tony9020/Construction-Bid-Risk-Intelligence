export interface ExtractedEntity {
  entity_type: "MONEY" | "DATE" | "LAW";
  value: string;
  context: string;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  page_number: number;
}

export interface BidAnalysis {
  project_name: string;
  total_pages: number;
  raw_text: string;
  entities: ExtractedEntity[];
}
