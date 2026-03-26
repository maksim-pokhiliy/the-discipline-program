"use client";

import { Stack, Container, Typography, alpha, Box } from "@mui/material";
import { type Variants, motion } from "framer-motion";

import { type ContactPageData } from "@repo/contracts/pages";

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.58, 1] } },
};

interface ContactHeroProps {
  hero: ContactPageData["hero"];
}

export const ContactHero = ({ hero }: ContactHeroProps) => {
  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        backgroundImage: `linear-gradient(${alpha(theme.palette.common.black, 0.6)}, ${alpha(theme.palette.common.black, 0.6)}), url(${hero.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: theme.palette.common.white,
      })}
    >
      <Box sx={(theme) => ({ ...theme.mixins.toolbar })} />

      <Container maxWidth="lg">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <Stack spacing={8} sx={{ py: 8 }}>
            <motion.div variants={fadeSlideUp}>
              <Stack
                spacing={2}
                sx={{
                  textAlign: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Typography variant="display2" sx={{ fontWeight: 700 }}>
                  {hero.title}
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 400, lineHeight: 1.4, opacity: 0.8 }}>
                  {hero.subtitle}
                </Typography>
              </Stack>
            </motion.div>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
};
