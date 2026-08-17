/* FORMADOS — revelado del índice de las nueve semanas al hacer scroll. */
(function () {
  var rows = document.querySelectorAll(".f-indice-row");
  if (!rows.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    rows.forEach(function (r) { r.classList.add("on"); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("on");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
  );

  rows.forEach(function (r) { io.observe(r); });
})();
