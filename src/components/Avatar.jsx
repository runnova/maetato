import { initials } from '../utils.js';

export default function Avatar(props) {
  const size = () => props.size || 44;
  return (
    <div
      class={`avatar ${props.class || ''}`}
      style={{ width: `${size()}px`, height: `${size()}px`, 'font-size': `${Math.max(11, size() * 0.36)}px` }}
    >
      {props.src ? <img src={props.src} alt="" /> : initials(props.name)}
    </div>
  );
}
