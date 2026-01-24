import he from 'he';
type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
};
type CardPropTyes = {
  question: string;
  options: Option[];
  selectedOptionId: string;
};
export default function Card(props: CardPropTyes) {
  return (
    <ul className="p-2 mb-1 border-2 border-black rounded-md space-y-3 hover:shadow-lg">
      <div>{props.question}</div>
      {props.options.map((option) => (
        <li
          key={option.id}
          className={`p-2 rounded border-2 ${
            option.isCorrect
              ? 'bg-green-100 border-green-500'
              : option.id === props.selectedOptionId
                ? 'bg-red-100 border-red-500'
                : 'bg-gray-50 border-transparent'
          }`}
        >
          <div className="flex justify-between">
            <div>{he.decode(option.text)}</div>
            <div>
              {option.isCorrect && '✓ '}
              {option.id === props.selectedOptionId && !option.isCorrect && '✗ '}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
