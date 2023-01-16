import yayJpg from '../assets/yay.jpg';

export default function HomePage() {
  (window as any).Egos.getModel('albums')
    .execute({ method: 'findOne', args: [] })
    .then(console.log);
  return (
    <div>
      <h2>Yay! Welcome to umi!</h2>
      <p>
        <img src={yayJpg} width="388" />
      </p>
      <p>
        To get started, edit <code>pages/index.tsx</code> and save to reload.
      </p>
    </div>
  );
}
