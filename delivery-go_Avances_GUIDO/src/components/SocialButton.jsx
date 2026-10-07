function SocialButton({ image, text }) {
    
    return (

        <button
            type="button"
            className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors shadow-sm">
            
            <img src={image} alt="" className="w-5 h-5 object-contain"/>
            <span>{text}</span>
        </button>
    )
}

export default SocialButton