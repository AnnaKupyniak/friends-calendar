import './Modal.css'
export default function Modal({children, isOpen, onClose}){
    if(!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e)=> e.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}