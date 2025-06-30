import { createPortal, useState } from "./utils";

function ModalContent({ onClose }) {
  return (
    <div className="modal">
      <div key={'test'}>这是一个模态对话框</div>
      <button key={'btn'} onClick={onClose}>关闭</button>
    </div>
  );
}

function App() {
  const [showModal, setShowModal] = useState(false);
  const dom = createPortal(
    <ModalContent onClose={() => {
      // console.log('点击');
      setShowModal(false)
    }} />,
    document.body
  );
  console.log('dom', dom)
  return (
    <>
      <button key={'btn'} onClick={() => setShowModal(true)}>
        使用 portal 展示模态（motal）
      </button>
      {showModal && dom}
      <div id="test12">test12</div>
    </>
  );
}

const dom = <App key={'app12'} />

export default dom;
