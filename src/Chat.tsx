import { FunctionComponent } from "react";
import { makeStyles } from "@mui/styles";
import Box from "@mui/material/Box";

const useStyles = makeStyles({});

const Chat: FunctionComponent = () => {
  const classes = useStyles();
  return (
    <Box>
      <Box className={classes.channels}></Box>
      <Box className={classes.sidebar}></Box>
    </Box>
  );
};

export default Chat;
