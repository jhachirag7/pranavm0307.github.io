

const App = () =>{
    const [name,changedName] = React.useState("Nafi")
    const result = (event) =>{
        changedName(event.target.value)
    }
    
  return (
     
     <div className="container">
        <h1>QR CODE GENERATOR</h1>
        <input type="text"
        onChange={result}
        />
        
        <img        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${name}`}
        alt="QRcode"
        className="img"/>
        
          </div>
  )
}
ReactDOM.render(
 <App/>,
  document.getElementById('react-app')
);
