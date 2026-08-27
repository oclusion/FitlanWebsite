import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import contentService from "../services/contentService";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

const Faqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    contentService.getFaqs()
      .then(setFaqs)
      .catch((error) => console.log("No se pudieron cargar las FAQs", error));
  }, []);

  return (
    <div className="light">
      <Header />
      <main className="pt-b-108">
        <div className="container">
          <h1>Preguntas frecuentes</h1>
          <div className="faq-list">
            {faqs.map((faq) => {
              const expanded = expandedId === faq.id;
              return (
                <button
                  key={faq.id}
                  type="button"
                  className="faq-item"
                  onClick={() => setExpandedId(expanded ? null : faq.id)}
                >
                  <div className="faq-question">
                    <span>{faq.question}</span>
                    {expanded ? <IoChevronUp /> : <IoChevronDown />}
                  </div>
                  {expanded ? <p className="faq-answer">{faq.answer}</p> : null}
                </button>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Faqs;
