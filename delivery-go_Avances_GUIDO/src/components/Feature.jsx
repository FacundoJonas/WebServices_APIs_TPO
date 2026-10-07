function Feature({ icon, title, description }) {
    
    return (

        <div className="flex items-start gap-space-sm p-space-xs rounded-lg bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>

            <div className="flex flex-col">
                <span className="font-body-md-medium text-body-md-medium text-on-surface">{title}</span>
                <span className="font-caption-sm text-caption-sm text-on-surface-variant">{description}</span>
            </div>
        </div>
    )
}

export default Feature