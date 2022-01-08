import type { NextPage } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { makeStyles } from "@mui/styles";
import Footer from "src/Footer";
import theme from "src/theme";
import Chat from "src/Chat";
import Header from "src/Header";

const useStyles = makeStyles({
  mainContainer: {
    margin: theme.spacing(2),
  },
  headerContainer: {},
  chatContainer: {
    display: "flex",
    flexDirection: "column",
  },
  footerContainer: {},
});

const Index: NextPage = () => {
  const classes = useStyles();

  return (
    <Container className={classes.mainContainer} maxWidth="lg">
      <Box className={classes.headerContainer}>
        <Header />
      </Box>
      <Box className={classes.chatContainer}>
        <Chat />
      </Box>
      <Box className={classes.footerContainer}>
        <Footer />
      </Box>
    </Container>
  );
};

export default Index;
