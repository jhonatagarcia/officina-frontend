/*
 * TODO(WhatsApp Cloud API): componente preservado e pausado.
 * A landing page nao importa este modulo enquanto a feature estiver fora do produto.
 *
import { Check, Send } from 'lucide-react';
import { whatsapp } from '../content';
import { landingWhatsAppMessages } from '../whatsapp-messages';
import { WhatsAppIcon } from '../components/whatsapp-icon';
import { useInView } from '../hooks/use-in-view';

export function WhatsAppSection() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <section className="section wa-section" id="whatsapp" ref={ref}>
      <div className="section-inner">
        <div className="wa-grid">
          <div>
            <div className="wa-tag">
              <WhatsAppIcon size={14} />
              {whatsapp.tag}
            </div>
            <h2 className="wa-title">{whatsapp.title}</h2>
            <p className="wa-desc">{whatsapp.description}</p>
            <ul className="wa-list">
              {whatsapp.bullets.map((item) => (
                <li key={item}>
                  <div className="wa-check">
                    <Check size={12} aria-hidden />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="wa-phone-outer" aria-label="Exemplo de conversa automatica no WhatsApp">
            <div className="wa-phone">
              <div className="wa-phone-top">
                <span className="wa-phone-time">9:41</span>
                <span aria-hidden="true">▂ ▄ ● ▭</span>
              </div>
              <div className="wa-chat-head">
                <span className="wa-ch-back" aria-hidden="true">{'<'}</span>
                <div className="wa-ch-avatar">AP</div>
                <div>
                  <div className="wa-ch-name">AutoPro System</div>
                  <div className="wa-ch-status">online</div>
                </div>
              </div>
              <div className="wa-body">
                <div className="wa-day-badge">Hoje</div>
                {landingWhatsAppMessages.map((message, index) => (
                  <div
                    className={`wa-bubble${inView ? ' shown' : ''}`}
                    key={message.status}
                    style={{ transitionDelay: `${index * 260}ms` }}
                  >
                    <strong>{message.label}</strong>
                    <br />
                    {message.text}
                    <div className="wa-bubble-tick">{message.time} lido</div>
                  </div>
                ))}
              </div>
              <div className="wa-bottom">
                <div className="wa-input-mock">Mensagem...</div>
                <div className="wa-send-btn">
                  <Send size={14} fill="currentColor" aria-hidden />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
*/

export {};
