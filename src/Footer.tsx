import * as React from "react";
import Typography from "@mui/material/Typography";

export default function Footer() {
  return (
    <Typography variant="body2" color="text.secondary" align="left">
      {new Date().getFullYear()}
    </Typography>
  );
}
