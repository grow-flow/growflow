import React from "react";
import { Box, Typography, Button } from "@mui/material";

interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: { label: string; onClick: () => void };
  children?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, action, children }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 2,
      gap: 1,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
      <Typography variant="h5">{title}</Typography>
      {count !== undefined && (
        <Typography variant="body2" color="textSecondary">
          {count}
        </Typography>
      )}
    </Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {children}
      {action && (
        <Button size="small" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  </Box>
);

export default SectionHeader;
