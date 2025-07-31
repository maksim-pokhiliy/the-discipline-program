export const scrollToElement = (id: string) => {
  const target = document.getElementById(id);

  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
};
