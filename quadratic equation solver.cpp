#include<simplecpp>

main_program{
double a,b,c;
cout<<"enter coefficient of x^2"<<endl;
cin>>a;
cout<<endl;
cout<<"enter coefficient of x"<<endl;
cin>>b;
cout<<endl;
cout<<"enter constant term"<<endl;
cin>>c;
cout<<endl;

double d,e,f;
double l,m,n;
l=2*a;
d=b*b;
e=d-4*a*c;
f=sqrt(e);
double h,i,j,k;
h=-b+f;
i=-b-f;
j=h/l;
k=i/l;
cout<<"first root is"<<" "<<j<<endl;
cout<<"second root is"<<" "<<k<<endl;

}
