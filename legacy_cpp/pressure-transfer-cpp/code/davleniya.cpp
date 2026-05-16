#include "davleniya.h"
#include "ui_davleniya.h"
int pres;
Davleniya::Davleniya(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::Davleniya)
{
    ui->setupUi(this);
    ui->EnterLineEdit->setText("0");
    ui->PasLineEdit->setText("0");
    ui->KPasLineEdit->setText("0");
    ui->MPasLineEdit->setText("0");
    ui->BarLineEdit->setText("0");
    ui->KGLineEdit->setText("0");
    ui->AtmLineEdit->setText("0");
    ui->RtutLineEdit->setText("0");
}

Davleniya::~Davleniya()
{
    delete ui;
}


void Davleniya::on_comboBox_currentIndexChanged(int index)
{
    pres=index;
}


void Davleniya::on_pushButton_clicked()
{
    QString val=ui->EnterLineEdit->text();
    double DblVal =val.toDouble();
    if(pres==0)
    {
        ui->PasLineEdit->setText(QString::number(DblVal));
        double KDblVal=DblVal/1000;
        ui->KPasLineEdit->setText(QString::number(KDblVal));
        double MDblVal=DblVal/1000000;
        ui->MPasLineEdit->setText(QString::number(MDblVal));
        double BarDblVal=DblVal/100000;
        ui->BarLineEdit->setText(QString::number(BarDblVal));
        double KiloDblVal=DblVal/98066.0;
        ui->KGLineEdit->setText(QString::number(KiloDblVal));
        double AtmDblVal=DblVal/101325.0;
        ui->AtmLineEdit->setText(QString::number(AtmDblVal));
        double RtutDblVal=DblVal/133.0;
        ui->RtutLineEdit->setText(QString::number(RtutDblVal));
    }else if(pres==1)
    {
        ui->KPasLineEdit->setText(QString::number(DblVal));
        double MDblVal=DblVal/1000;
        ui->MPasLineEdit->setText(QString::number(MDblVal));
        double PasDblVal=DblVal/1000000;
        ui->PasLineEdit->setText(QString::number(PasDblVal));
        double BarDblVal=DblVal/100;
        ui->BarLineEdit->setText(QString::number(BarDblVal));
        double KiloDblVal=DblVal*0.010197162;
        ui->KGLineEdit->setText(QString::number(KiloDblVal));
        double AtmDblVal=DblVal/101.325;
        ui->AtmLineEdit->setText(QString::number(AtmDblVal));
        double RtutDblVal=DblVal*7.501;
        ui->RtutLineEdit->setText(QString::number(RtutDblVal));
    }else if(pres==2)
    {
        ui->MPasLineEdit->setText(QString::number(DblVal));
        double KDblVal=DblVal*1000;
        ui->KPasLineEdit->setText(QString::number(KDblVal));
        double PasDblVal=DblVal*1000000;
        ui->PasLineEdit->setText(QString::number(PasDblVal));
        double BarDblVal=DblVal*10;
        ui->BarLineEdit->setText(QString::number(BarDblVal));
        double KiloDblVal=DblVal*10.197162;
        ui->KGLineEdit->setText(QString::number(KiloDblVal));
        double AtmDblVal=DblVal*9.869;
        ui->AtmLineEdit->setText(QString::number(AtmDblVal));
        double RtutDblVal=DblVal*7501.0;
        ui->RtutLineEdit->setText(QString::number(RtutDblVal));
    }else if(pres==3)
    {
        ui->BarLineEdit->setText(QString::number(DblVal));
        double KDblVal=DblVal*100;
        ui->KPasLineEdit->setText(QString::number(KDblVal));
        double MDblVal=DblVal/10;
        ui->MPasLineEdit->setText(QString::number(MDblVal));
        double PasDblVal=DblVal/100000;
        ui->PasLineEdit->setText(QString::number(PasDblVal));
        double KiloDblVal=DblVal*1.0197162;
        ui->KGLineEdit->setText(QString::number(KiloDblVal));
        double AtmDblVal=DblVal/1.01325;
        ui->AtmLineEdit->setText(QString::number(AtmDblVal));
        double RtutDblVal=DblVal*7501;
        ui->RtutLineEdit->setText(QString::number(RtutDblVal));
    }else if(pres==4)
    {

        ui->KGLineEdit->setText(QString::number(DblVal));
        double KDblVal=DblVal*0.010197162;
        ui->KPasLineEdit->setText(QString::number(KDblVal));
        double MDblVal=DblVal*0.000010197162;
        ui->MPasLineEdit->setText(QString::number(MDblVal));
        double PasDblVal=DblVal*10.197162;
        ui->PasLineEdit->setText(QString::number(PasDblVal));
        double BarDblVal=DblVal*0.980665;
        ui->BarLineEdit->setText(QString::number(BarDblVal));
        double AtmDblVal=DblVal*0.967841;
        ui->AtmLineEdit->setText(QString::number(AtmDblVal));
        double RtutDblVal=DblVal*735.559;
        ui->RtutLineEdit->setText(QString::number(RtutDblVal));
    }else if(pres==5)
    {
        ui->AtmLineEdit->setText(QString::number(DblVal));
        double KDblVal=DblVal*101.325;
        ui->KPasLineEdit->setText(QString::number(KDblVal));
        double MDblVal=DblVal*0.101325;
        ui->MPasLineEdit->setText(QString::number(MDblVal));
        double PasDblVal=DblVal*101325.0;
        ui->PasLineEdit->setText(QString::number(PasDblVal));
        double BarDblVal=DblVal*1.01325;
        ui->BarLineEdit->setText(QString::number(BarDblVal));
        double KiloDblVal=DblVal*1.03323;
        ui->KGLineEdit->setText(QString::number(KiloDblVal));
        double RtutDblVal=DblVal*760.0;
        ui->RtutLineEdit->setText(QString::number(RtutDblVal));
    }else if(pres==6)
    {
        ui->RtutLineEdit->setText(QString::number(DblVal));
        double KDblVal=DblVal*0.133322;
        ui->KPasLineEdit->setText(QString::number(KDblVal));
        double MDblVal=DblVal*0.000133322;
        ui->MPasLineEdit->setText(QString::number(MDblVal));
        double PasDblVal=DblVal*133.322;
        ui->PasLineEdit->setText(QString::number(PasDblVal));
        double BarDblVal=DblVal/750;
        ui->BarLineEdit->setText(QString::number(BarDblVal));
        double KiloDblVal=DblVal/736;
        ui->KGLineEdit->setText(QString::number(KiloDblVal));
        double AtmDblVal=DblVal/760;
        ui->AtmLineEdit->setText(QString::number(AtmDblVal));

    }



}

