import './SingleCard.css'

export default function SingleCard({ card, handleChoice, flipped, disable }) {

    const handleClick = () => {
        if (!disable) {
            handleChoice(card)
        }
    }

    const flippedClass = flipped ? "flipped" : "";

    return (
        <div className={`card ${flippedClass}`}>
            <img className="front" src={card.src} alt="card front" />
            <img
                className="back"
                src="/img/cover.png"
                onClick={handleClick}
                alt="card back"
            />
        </div>
    )
}